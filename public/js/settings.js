let charList = document.querySelectorAll('.char');
let resetButton = document.querySelector('input.reset[type=button]');

charList.forEach((char) => {
    let frame = char.querySelector('.frame');
    let footer = char.querySelector('.footer');
    let inPool = footer.querySelector('.in-pool');
    let rateUp = footer.querySelector('.rate-up');
    let rate = footer.querySelector('.rate');

    inPool.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            frame.classList.remove('grayscale');
        } else {
            frame.classList.add('grayscale');
        }
    });

    rateUp.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            rate.classList.remove('hidden');
        } else {
            rate.classList.add('hidden');
        }
    });
});

resetButton.addEventListener('click', () => window.location.reload());