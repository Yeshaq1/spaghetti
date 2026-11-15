// Where careers applications live. Two independent parts, each picked from the environment:
//
//   Records (applications, status, notes)
//     Postgres         when DATABASE_URL is set. One table, created on first use.
//     Local files      otherwise, under BENCH_DATA_DIR (default ./.data/bench). For local dev.
//
//   CV files (PDFs)
//     S3-compatible bucket   when S3_BUCKET is set (Railway Buckets, R2, S3, GCS interop).
//                            Also needs S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY;
//                            S3_REGION defaults to "auto", S3_FORCE_PATH_STYLE=true if needed.
//     Local files            otherwise, next to the local records.
//
// Nothing is kept in the app's memory between requests, so restarts and deploys lose nothing
// once both are configured.

const fs = require('fs/promises');
const path = require('path');

const DATA_DIR = path.resolve(process.env.BENCH_DATA_DIR || path.join(__dirname, '..', '.data', 'bench'));
const TABLE = 'careers_applications';
const CV_PREFIX = 'careers/cv/';

const toIso = (value) => (value instanceof Date ? value.toISOString() : value || null);

// ---------- Records: Postgres ----------

const postgresRecords = (connectionString) => {
    const { Pool } = require('pg');
    // TLS follows the URL: add ?sslmode=require when connecting over a public endpoint.
    const pool = new Pool({ connectionString, max: 5 });
    pool.on('error', (error) => console.error('[careers] postgres pool error:', error.message));
    let ready = null;

    // The full application is kept as JSONB so new form questions need no migration; the
    // columns are the parts the talent page sorts or updates.
    const ensureTable = () => {
        ready = ready || pool.query(`
            CREATE TABLE IF NOT EXISTS ${TABLE} (
                id TEXT PRIMARY KEY,
                submitted_at TIMESTAMPTZ NOT NULL,
                email TEXT NOT NULL,
                full_name TEXT NOT NULL,
                data JSONB NOT NULL,
                status TEXT NOT NULL DEFAULT 'new',
                notes TEXT,
                review_updated_at TIMESTAMPTZ
            );
            CREATE INDEX IF NOT EXISTS ${TABLE}_email_idx ON ${TABLE} (email);
            CREATE INDEX IF NOT EXISTS ${TABLE}_submitted_idx ON ${TABLE} (submitted_at);
        `).catch((error) => {
            ready = null;
            throw error;
        });
        return ready;
    };

    const review = (row) => ({ status: row.status, notes: row.notes || '', updatedAt: toIso(row.review_updated_at) });

    return {
        kind: 'postgres',
        async insertApplication(record) {
            await ensureTable();
            await pool.query(
                `INSERT INTO ${TABLE} (id, submitted_at, email, full_name, data) VALUES ($1, $2, $3, $4, $5)`,
                [record.id, new Date(record.submittedAt), record.email, record.fullName, record]
            );
        },
        async listApplications() {
            await ensureTable();
            const { rows } = await pool.query(`SELECT data, status, notes, review_updated_at FROM ${TABLE} ORDER BY submitted_at ASC`);
            return rows.map((row) => ({ ...row.data, review: review(row) }));
        },
        async updateReview(id, { status, notes }) {
            await ensureTable();
            const { rows } = await pool.query(
                `UPDATE ${TABLE}
                    SET status = COALESCE($1, status), notes = COALESCE($2, notes), review_updated_at = now()
                  WHERE id = $3
              RETURNING status, notes, review_updated_at`,
                [status ?? null, notes ?? null, id]
            );
            return rows[0] ? review(rows[0]) : null;
        }
    };
};

// ---------- Records: local files (development) ----------

const fileRecords = () => {
    const applicationsFile = path.join(DATA_DIR, 'applications.jsonl');
    const reviewsFile = path.join(DATA_DIR, 'reviews.json');

    let queue = Promise.resolve();
    const serial = (task) => {
        const run = queue.then(task, task);
        queue = run.catch(() => {});
        return run;
    };

    const readReviews = async () => {
        try {
            return JSON.parse(await fs.readFile(reviewsFile, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') return {};
            throw error;
        }
    };

    return {
        kind: 'local files',
        insertApplication: (record) => serial(async () => {
            await fs.mkdir(DATA_DIR, { recursive: true });
            await fs.appendFile(applicationsFile, `${JSON.stringify(record)}\n`, 'utf8');
        }),
        async listApplications() {
            let text = '';
            try {
                text = await fs.readFile(applicationsFile, 'utf8');
            } catch (error) {
                if (error.code !== 'ENOENT') throw error;
            }
            const reviews = await readReviews();
            return text.split('\n').filter(Boolean).flatMap((line) => {
                try {
                    const record = JSON.parse(line);
                    return [{ ...record, review: reviews[record.id] || { status: 'new', notes: '' } }];
                } catch {
                    return [];
                }
            });
        },
        updateReview: (id, { status, notes }) => serial(async () => {
            await fs.mkdir(DATA_DIR, { recursive: true });
            const reviews = await readReviews();
            const current = reviews[id] || { status: 'new', notes: '' };
            reviews[id] = { status: status ?? current.status, notes: notes ?? current.notes, updatedAt: new Date().toISOString() };
            const temp = `${reviewsFile}.tmp`;
            await fs.writeFile(temp, JSON.stringify(reviews, null, 2), 'utf8');
            await fs.rename(temp, reviewsFile);
            return reviews[id];
        })
    };
};

// ---------- CV files: S3-compatible bucket ----------

const bucketFiles = () => {
    const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
    const bucket = process.env.S3_BUCKET;
    const client = new S3Client({
        region: process.env.S3_REGION || 'auto',
        endpoint: process.env.S3_ENDPOINT || undefined,
        forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
        credentials: process.env.S3_ACCESS_KEY_ID
            ? { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '' }
            : undefined
    });

    return {
        kind: 'bucket',
        async putCv(id, buffer) {
            await client.send(new PutObjectCommand({
                Bucket: bucket,
                Key: `${CV_PREFIX}${id}.pdf`,
                Body: buffer,
                ContentType: 'application/pdf'
            }));
        },
        async getCv(id) {
            try {
                const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: `${CV_PREFIX}${id}.pdf` }));
                return Buffer.from(await result.Body.transformToByteArray());
            } catch (error) {
                if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) return null;
                throw error;
            }
        }
    };
};

// ---------- CV files: local (development) ----------

const localFiles = () => {
    const dir = path.join(DATA_DIR, 'cv');
    return {
        kind: 'local files',
        async putCv(id, buffer) {
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(path.join(dir, `${id}.pdf`), buffer);
        },
        async getCv(id) {
            try {
                return await fs.readFile(path.join(dir, `${id}.pdf`));
            } catch (error) {
                if (error.code === 'ENOENT') return null;
                throw error;
            }
        }
    };
};

const records = process.env.DATABASE_URL ? postgresRecords(process.env.DATABASE_URL) : fileRecords();
const files = process.env.S3_BUCKET ? bucketFiles() : localFiles();

console.log(`[careers] applications stored in ${records.kind}; CVs stored in ${files.kind}`);

module.exports = { records, files };
