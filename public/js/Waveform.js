const WaveformLocal = {
    animationID: null,
    canvas: null,
    draw: (stream, canvasElement) => {
        WaveformLocal.canvas = canvasElement;
        const canvasContext = WaveformLocal.canvas.getContext('2d');
        const audioContext = new AudioContext();
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 8192;
        sourceNode.connect(analyserNode);
        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
        function drawWaveform() {
            WaveformLocal.animationID = requestAnimationFrame(drawWaveform);
            analyserNode.getByteTimeDomainData(dataArray);
            canvasContext.clearRect(0, 0, WaveformLocal.canvas.width, WaveformLocal.canvas.height);
            canvasContext.fillStyle = 'rgba(0, 0, 0, 0)';
            canvasContext.fillRect(0, 0, WaveformLocal.canvas.width, WaveformLocal.canvas.height);
            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = '#ffffff';
            canvasContext.beginPath();
            const sliceWidth = WaveformLocal.canvas.width * 1.0 / bufferLength;
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128;
                const y = v * WaveformLocal.canvas.height / 2;
                if(i === 0) canvasContext.moveTo(x, y); else canvasContext.lineTo(x, y);
                x += sliceWidth;
            }
            canvasContext.stroke();
        }
        drawWaveform();
    },
    stop: () => {
        if (WaveformLocal.animationID != null) cancelAnimationFrame(WaveformLocal.animationID);
        if (WaveformLocal.canvas) WaveformLocal.canvas.getContext('2d').clearRect(0, 0, WaveformLocal.canvas.width, WaveformLocal.canvas.height);
        WaveformLocal.animationID = null;
    }
}

const WaveformRemote = {
    animationID: null,
    canvas: null,
    draw: (stream, canvasElement) => {
        WaveformRemote.canvas = canvasElement;
        const canvasContext = WaveformRemote.canvas.getContext('2d');
        const audioContext = new AudioContext();
        const sourceNode = audioContext.createMediaStreamSource(stream);
        const analyserNode = audioContext.createAnalyser();
        analyserNode.fftSize = 8192;
        sourceNode.connect(analyserNode);
        const bufferLength = analyserNode.fftSize;
        const dataArray = new Uint8Array(bufferLength);
    
        function drawWaveform() {
            WaveformRemote.animationID = requestAnimationFrame(drawWaveform);
            analyserNode.getByteTimeDomainData(dataArray);
            canvasContext.clearRect(0, 0, WaveformRemote.canvas.width, WaveformRemote.canvas.height);
            canvasContext.fillStyle = 'rgba(0, 0, 0, 0)';
            canvasContext.fillRect(0, 0, WaveformRemote.canvas.width, WaveformRemote.canvas.height);
            canvasContext.lineWidth = 1;
            canvasContext.strokeStyle = '#ffffff';
            canvasContext.beginPath();
            const sliceWidth = WaveformRemote.canvas.width * 1.0 / bufferLength;
            let x = 0;
            for(let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128;
                const y = v * WaveformRemote.canvas.height / 2;
                if(i === 0) canvasContext.moveTo(x, y); else canvasContext.lineTo(x, y);
                x += sliceWidth;
            }
            canvasContext.stroke();
        }
        drawWaveform();
    },
    stop: () => {
        if (WaveformRemote.animationID != null) cancelAnimationFrame(WaveformRemote.animationID);
        if (WaveformRemote.canvas) WaveformRemote.canvas.getContext('2d').clearRect(0, 0, WaveformRemote.canvas.width, WaveformRemote.canvas.height);
        WaveformRemote.animationID = null;
    }
}