let charList = document.querySelectorAll('.char');
let resetButton = document.querySelector('input.reset[type=button]');

charList.forEach((char) => {
    let key = char.querySelector('input.key[type=hidden]').value;
    let frame = char.querySelector('.frame');
    let footer = char.querySelector('.footer');
    let inPool = footer.querySelector('.in-pool');
    let rateUp = footer.querySelector('.rate-up');
    let rate = footer.querySelector('.rate');
    
    if(rate === null) {
        rate = document.createElement('label');
        let rateInput = document.createElement('input');
        
        rate.className = 'rate';
        rateInput.type = 'text';
        rateInput.name = `rate[${key}]`;
        rateInput.value = 0;
        
        rate.appendChild(rateInput);
        rate.appendChild(document.createTextNode('%'));
    }

    inPool.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            frame.classList.remove('grayscale');
        } else {
            frame.classList.add('grayscale');
        }
    });

    rateUp.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            footer.appendChild(rate);
        } else {
            footer.removeChild(footer.querySelector('.rate'));
        }
    });
});

resetButton.addEventListener('click', () => window.location.reload());