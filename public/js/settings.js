let charList = document.querySelectorAll('.char');
let resetButton = document.querySelector('input.reset[type=button]');

charList.forEach((char) => {
    let key = char.querySelector('input.key[type=hidden]').value;
    let frame = char.querySelector('.frame');
    let inPool = char.querySelector('.in-pool');
    let rateUp = char.querySelector('.rate-up');
    
    inPool.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            frame.classList.remove('grayscale');
        } else {
            frame.classList.add('grayscale');
        }
    });

    rateUp.querySelector('input[type=checkbox]').addEventListener('change', (e) => {
        if(e.target.checked) {
            let rate = document.createElement('label');
            let rateInput = document.createElement('input');
            rate.className = 'rate';
            rateInput.type = 'text';
            rateInput.name = `rate[${key}]`;
            rateInput.value = 0;
            
            rate.appendChild(rateInput);
            rate.appendChild(document.createTextNode('%'));
            rateUp.appendChild(rate);
        } else {
            rateUp.removeChild(rateUp.querySelector('.rate'));
        }
    });
});

resetButton.addEventListener('click', () => window.location.reload());