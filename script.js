// 1. Find the element in the HTML using its ID
const button = document.getElementById('action-btn');

// 2. Define what happens when the button is clicked
button.addEventListener('click', function() {
    // Opens WhatsApp in a new browser tab
    window.open('https://wa.me//6285813536200?text=Hello,%20I%20would%20like%20to%20make%20an%20appointment!', '_blank');
    document.body.style.backgroundColor = '#e8f4f8';
    
    // Alert the user
    alert('JavaScript is officially linked and working!');
});
