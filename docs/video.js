
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export async function recordWebM(timeSlider, canvas, draw) {
  const fps = 60;
  const bitrate = 8_000_000;
  const stream = canvas.captureStream(fps);
  const mime =
    (MediaRecorder.isTypeSupported('video/webm;codecs=vp9') && 'video/webm;codecs=vp9') ||
    (MediaRecorder.isTypeSupported('video/webm;codecs=vp8') && 'video/webm;codecs=vp8') ||
    'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });

  const chunks = [];
  rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
  const done = new Promise(resolve => (rec.onstop = () =>
    resolve(new Blob(chunks, { type: mime }))));

  rec.start();

  const frameCount = parseFloat(timeSlider.max);
  for (let f = 0; f < frameCount; f++) {
    timeSlider.value = (parseFloat(timeSlider.value) + 1).toString();
    draw();
    // Give the browser one paint so the frame lands in the stream
    await new Promise(r => requestAnimationFrame(r));
  }

  rec.stop();
  const blob = await done;
  downloadBlob(blob, 'orbit.webm');
}