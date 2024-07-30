import { streamGemini } from './gemini-api.js';

let form = document.querySelector('form');
let promptInput = document.querySelector('input[name="prompt"]');
let output = document.querySelector('.output');

const videoElement = document.getElementById('videoElement');
const canvasElement = document.getElementById('canvasElement');
const photoElement = document.getElementById('photoElement');
const startButton = document.getElementById('startButton');
const captureButton = document.getElementById('captureButton');
const image = document.getElementById('output');
const fileButton = document.getElementById('file');

const chosenImage = document.getElementById('chosen-image');

let stream;

async function startWebcam() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        videoElement.srcObject = stream;
        startButton.disabled = true;
        captureButton.disabled = false;
    } catch (error) {
        console.error('Error accessing webcam:', error);
    }
}

function loadFile(event) {
  image.src = URL.createObjectURL(event.target.files[0]);
  chosenImage.value = image.src;
  photoElement.src = '';
  photoElement.style.display = 'none';
  image.style.display = 'block';
};

function capturePhoto() {
  canvasElement.width = videoElement.videoWidth;
  canvasElement.height = videoElement.videoHeight;
  canvasElement.getContext('2d').drawImage(videoElement, 0, 0);
  const photoDataUrl = canvasElement.toDataURL('image/jpeg');
  photoElement.src = photoDataUrl;
  photoElement.style.display = 'block';
  image.style.display = 'none';
}

startButton.addEventListener('click', startWebcam);
captureButton.addEventListener('click', capturePhoto);
fileButton.addEventListener('change', loadFile);

form.onsubmit = async (ev) => {
  ev.preventDefault();
  output.textContent = 'Generating...';

  try {
    // Load the image as a base64 string
    let imageUrl;
    let imageBase64;

    if (photoElement.src) {
      imageBase64 = photoElement.src;
      imageBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
    }

    if (form.elements.namedItem('chosen-image').value) {
      let imageUrl = form.elements.namedItem('chosen-image').value;
      imageBase64 = await fetch(imageUrl)
        .then(r => r.arrayBuffer())
        .then(a => base64js.fromByteArray(new Uint8Array(a)));
    }

    // Assemble the prompt by combining the text with the chosen image
    let contents = [
      {
        role: 'user',
        parts: [
          { inline_data: { mime_type: 'image/jpeg', data: imageBase64, } },
          { text: 'Can you tell me the mood of the picture? Please also add a rate that is a number with a range from 0 to 10 where 0 equal the lower bad mood and 10 the best happiest mood.' }
        ]
      }
    ];

    // Call the multimodal model, and get a stream of results
    let stream = streamGemini({
      model: 'gemini-1.5-flash', // or gemini-1.5-pro
      contents,
    });

    // Read from the stream and interpret the output as markdown
    let buffer = [];
    let string_result = "";
    let md = new markdownit();
    for await (let chunk of stream) {
      buffer.push(chunk);
            output.innerHTML = md.render(buffer.join(''));
    }
    
// Expected output: 42
  } catch (e) {
    output.innerHTML += '<hr>' + e;
  }
};
