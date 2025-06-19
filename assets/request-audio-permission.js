// Request microphone permission on load
window.addEventListener('DOMContentLoaded', () => {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        // Immediately stop tracks to avoid holding the mic
        stream.getTracks().forEach(track => track.stop());
        console.log('Microphone permission granted');
      })
      .catch(err => {
        console.warn('Microphone permission denied or error:', err);
      });
  } else {
    console.warn('getUserMedia not supported');
  }
}); 