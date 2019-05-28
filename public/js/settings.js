let cards = document.querySelectorAll('.card');

cards.forEach((card) => {
    let frame = card.querySelector('.frame');
    let checkbox = card.querySelector('.in-pool');
    
    checkbox.addEventListener('change', (e) => {
        if(e.target.checked) {
            frame.classList.remove('grayscale');
        } else {
            frame.classList.add('grayscale');
        }
    });
});