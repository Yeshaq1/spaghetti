/**
 * WebRTCCall.js - Simple OpenAI Realtime API Integration
 */

export class WebRTCCall {
    constructor() {
        this.pc = null;
        this.dataChannel = null;
        this.localStream = null;
        this.isCallActive = false;
        this.callModal = null;
        this.sessionTimeout = null;
        this.countdownInterval = null;
    }

    init() {
        this.createCallModal();
        return this;
    }

    createCallModal() {
        this.callModal = document.createElement('div');
        this.callModal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: none;
            justify-content: center;
            align-items: center;
            font-family: Arial, sans-serif;
        `;

        this.callModal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-radius: 20px;
                padding: 40px;
                text-align: center;
                max-width: 500px;
                width: 90%;
                border: 1px solid rgba(115, 251, 211, 0.3);
            ">
                <div id="callStatus">
                    <h2 style="color: #73fbd3; margin-bottom: 20px;">Connecting to AI...</h2>
                    <p style="color: #999;">Please allow microphone access</p>
                </div>
                
                <div id="callControls" style="display: none;">
                    <h3 style="color: #73fbd3; margin-bottom: 10px;">AI Assistant Connected</h3>
                    <div id="timer" style="
                        color: #ff6b6b;
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        text-align: center;
                    ">30</div>
                    <div style="margin: 20px 0;">
                        <button id="endCallBtn" style="
                            background: #ff4757;
                            color: white;
                            border: none;
                            padding: 15px 30px;
                            border-radius: 25px;
                            font-size: 16px;
                            cursor: pointer;
                            margin: 10px;
                        ">End Call</button>
                    </div>
                </div>
                
                <div id="errorMessage" style="
                    color: #ff4757;
                    margin-top: 20px;
                    display: none;
                "></div>
            </div>
        `;

        document.body.appendChild(this.callModal);

        // Event listeners
        this.callModal.querySelector('#endCallBtn').addEventListener('click', () => this.endCall());
    }

    async startCall() {
        // Prevent duplicate calls
        if (this.isCallActive) {
            return;
        }
        
        try {
            this.showModal();
            
            // Get microphone
            this.localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Get ephemeral token from server
            const response = await fetch('/api/get-token', { method: 'POST' });
            const tokenData = await response.json();
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get token');
            }
            
            // Connect to OpenAI using the ephemeral token
            await this.connectToOpenAI(tokenData.client_secret.value);
            
        } catch (error) {
            this.showError(error.message);
        }
    }

    async connectToOpenAI(ephemeralToken) {
        try {
            // Create WebRTC peer connection
            this.pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            // Add audio track
            const audioTrack = this.localStream.getAudioTracks()[0];
            this.pc.addTrack(audioTrack, this.localStream);

            // Handle incoming audio
            this.pc.ontrack = (event) => {
                if (event.track.kind === 'audio') {
                    const audio = new Audio();
                    audio.srcObject = event.streams[0];
                    audio.play();
                }
            };

            // Create data channel for events
            this.dataChannel = this.pc.createDataChannel('oai-events', { ordered: true });

            // Create SDP offer
            const offer = await this.pc.createOffer();
            await this.pc.setLocalDescription(offer);

            // Send offer to OpenAI
            const response = await fetch('https://api.openai.com/v1/realtime', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${ephemeralToken}`,
                    'Content-Type': 'application/sdp'
                },
                body: offer.sdp
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Set remote description
            const answerSDP = await response.text();
            const answer = new RTCSessionDescription({
                type: 'answer',
                sdp: answerSDP
            });
            await this.pc.setRemoteDescription(answer);

            this.isCallActive = true;
            this.callModal.querySelector('#callStatus').style.display = 'none';
            this.callModal.querySelector('#callControls').style.display = 'block';
            
            // Start countdown timer
            this.startCountdown();
            
            // Set 30 second timeout
            this.sessionTimeout = setTimeout(() => {
                this.endCall();
            }, 30000); // 30 seconds
            
            console.log('WebRTC connection established with OpenAI');

        } catch (error) {
            console.error('WebRTC connection error:', error);
            throw error;
        }
    }

    startCountdown() {
        let timeLeft = 30;
        const timerElement = this.callModal.querySelector('#timer');
        
        this.countdownInterval = setInterval(() => {
            timeLeft--;
            timerElement.textContent = timeLeft;
            
            // Change color as time runs out
            if (timeLeft <= 10) {
                timerElement.style.color = '#ff4757';
                timerElement.style.animation = 'pulse 0.5s infinite';
            } else if (timeLeft <= 20) {
                timerElement.style.color = '#ffa726';
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.countdownInterval);
            }
        }, 1000);
    }

    endCall() {
        this.isCallActive = false;
        
        // Clear timeout
        if (this.sessionTimeout) {
            clearTimeout(this.sessionTimeout);
            this.sessionTimeout = null;
        }
        
        // Clear countdown
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
        
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
        
        this.hideModal();
    }

    showModal() {
        this.callModal.style.display = 'flex';
    }

    hideModal() {
        this.callModal.style.display = 'none';
    }

    showError(message) {
        this.callModal.querySelector('#errorMessage').textContent = message;
        this.callModal.querySelector('#errorMessage').style.display = 'block';
        setTimeout(() => this.hideModal(), 5000);
    }

    createCallButton(container) {
        const button = document.createElement('button');
        button.innerHTML = '📞 Start AI Call';
        button.style.cssText = `
            background: linear-gradient(135deg, #73fbd3, #4facfe);
            color: #000;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px;
            transition: transform 0.2s;
        `;
        
        button.addEventListener('click', () => {
            if (!this.isCallActive) {
                this.startCall();
            }
        });
        button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.05)');
        button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
        
        if (container) container.appendChild(button);
        return button;
    }
}
