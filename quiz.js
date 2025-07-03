document.addEventListener('DOMContentLoaded', () => {

    const quizContainer = document.querySelector('.quiz-container');
    if (!quizContainer) {
        // Если на странице нет контейнера для анкеты, ничего не делаем.
        return;
    }

    // --- DOM элементы анкеты ---
    const stepsContainer = document.getElementById('quiz-steps-container');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const quizNavigation = document.getElementById('quiz-navigation');

    // --- Данные анкеты ---
    const quizStepsData = [
        {
            type: 'radio',
            name: 'supportFor',
            question: '1. Кому нужна поддержка?',
            options: [
                { value: 'Мне лично', icon: 'fa-user' },
                { value: 'Мне и партнеру', icon: 'fa-user-friends' },
                { value: 'Ребенку', icon: 'fa-child' }
            ]
        },
        {
            type: 'textarea',
            name: 'reasonForSupport',
            question: '2. В чем заключается ваш основной запрос или проблема?',
            placeholder: 'Опишите вашу ситуацию или причину обращения...'
        },
        {
            type: 'checkbox',
            name: 'availableDays',
            question: '3. В какие дни вам было бы удобно?',
            options: [
                { value: 'Понедельник', icon: 'fa-calendar-day' },
                { value: 'Вторник', icon: 'fa-calendar-day' },
                { value: 'Среда', icon: 'fa-calendar-day' },
                { value: 'Четверг', icon: 'fa-calendar-day' },
                { value: 'Пятница', icon: 'fa-calendar-day' },
                { value: 'Суббота', icon: 'fa-calendar-day' },
                { value: 'Воскресенье', icon: 'fa-calendar-day' }
            ]
        },
        {
            type: 'radio',
            name: 'age',
            question: '4. Ваш возраст?',
            options: [
                { value: 'До 18 лет', icon: 'fa-child' },
                { value: '18-25 лет', icon: 'fa-user-graduate' },
                { value: '26-40 лет', icon: 'fa-user-tie' },
                { value: '41-60 лет', icon: 'fa-user-alt' },
                { value: 'Старше 60 лет', icon: 'fa-user-nurse' }
            ]
        },
        {
            type: 'radio',
            name: 'urgency',
            question: '5. Насколько срочно вам нужна помощь?',
             options: [
                { value: 'Очень срочно (в течение 1-2 дней)', icon: 'fa-exclamation-triangle' },
                { value: 'В течение недели', icon: 'fa-calendar-week' },
                { value: 'В течение месяца', icon: 'fa-calendar-alt' },
                { value: 'Пока присматриваюсь', icon: 'fa-hourglass-half' }
            ]
        },
        {
             type: 'final',
             question: 'Спасибо!',
             text: 'Ваша анкета заполнена. Это поможет мне лучше подготовиться к нашей первой встрече. Нажмите "Отправить", и я свяжусь с вами в ближайшее время для уточнения деталей.'
        }
    ];

    let currentStep = 0;
    const totalSteps = quizStepsData.length;
    const quizAnswers = {};

    // --- Функции рендеринга ---
    function renderStep(stepIndex) {
        stepsContainer.innerHTML = '';
        const stepData = quizStepsData[stepIndex];
        const stepDiv = document.createElement('div');
        stepDiv.className = 'quiz-step';

        let content = `<h2 class="text-xl font-semibold mb-4">${stepData.question}</h2>`;
        
        switch (stepData.type) {
            case 'radio':
            case 'checkbox':
                content += '<div class="space-y-3">';
                stepData.options.forEach(opt => {
                    content += `
                        <label class="flex items-center p-4 border rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700">
                            <input type="${stepData.type}" name="${stepData.name}" value="${opt.value}" class="hidden">
                            <i class="fas ${opt.icon} w-6 text-center text-primary mr-4"></i>
                            <span>${opt.value}</span>
                        </label>
                    `;
                });
                content += '</div>';
                break;
            case 'textarea':
                content += `<textarea name="${stepData.name}" class="w-full p-3 border rounded-md bg-slate-50 dark:bg-slate-800 dark:border-slate-700" rows="4" placeholder="${stepData.placeholder}"></textarea>`;
                break;
             case 'final':
                content += `<p class="text-center text-slate-600 dark:text-slate-300">${stepData.text}</p>`
                break;
        }

        stepDiv.innerHTML = content;
        stepsContainer.appendChild(stepDiv);
        addInputListeners();
        restoreAnswer(stepData.name);
    }
    
    // --- Логика анкеты ---
    
    function updateDisplay() {
        // Progress Bar
        const progress = (currentStep / (totalSteps - 1)) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `Шаг ${currentStep + 1} из ${totalSteps}`;

        // Buttons
        prevBtn.disabled = currentStep === 0;
        nextBtn.classList.toggle('hidden', currentStep === totalSteps - 1);
        submitBtn.classList.toggle('hidden', currentStep !== totalSteps - 1);
        quizNavigation.classList.toggle('hidden', currentStep === totalSteps);
        
        if (currentStep === totalSteps) { // Thank you page
             stepsContainer.innerHTML = `<div class="text-center p-8">
                <i class="fas fa-check-circle text-5xl text-green-500 mb-4"></i>
                <h2 class="text-2xl font-bold mb-2">Анкета успешно отправлена!</h2>
                <p class="text-slate-600 dark:text-slate-300">Спасибо! Я свяжусь с вами в ближайшее время.</p>
             </div>`;
             progressText.textContent = 'Готово!';
             progressBar.style.width = `100%`;
        } else {
             renderStep(currentStep);
             validateStep();
        }
    }

    function saveAnswer() {
        const stepData = quizStepsData[currentStep];
        const name = stepData.name;
        if (stepData.type === 'radio') {
            const checked = stepsContainer.querySelector(`input[name="${name}"]:checked`);
            quizAnswers[name] = checked ? checked.value : undefined;
        } else if (stepData.type === 'checkbox') {
            const checked = Array.from(stepsContainer.querySelectorAll(`input[name="${name}"]:checked`)).map(el => el.value);
            quizAnswers[name] = checked;
        } else if (stepData.type === 'textarea') {
            quizAnswers[name] = stepsContainer.querySelector(`textarea[name="${name}"]`).value;
        }
    }
    
    function restoreAnswer(name) {
        const answer = quizAnswers[name];
        if (!answer) return;

        const stepData = quizStepsData.find(s => s.name === name);
         if (stepData.type === 'radio') {
            const input = stepsContainer.querySelector(`input[value="${answer}"]`);
            if(input) {
                input.checked = true;
                input.parentElement.classList.add('selected');
            }
        } else if (stepData.type === 'checkbox') {
             answer.forEach(val => {
                const input = stepsContainer.querySelector(`input[value="${val}"]`);
                if(input) {
                    input.checked = true;
                    input.parentElement.classList.add('selected');
                }
             });
        } else if (stepData.type === 'textarea') {
            stepsContainer.querySelector(`textarea[name="${name}"]`).value = answer;
        }
    }
    
    function validateStep() {
        const stepData = quizStepsData[currentStep];
        const name = stepData.name;
        let isValid = false;
        
        if(stepData.type === 'final') {
            isValid = true;
        } else {
            const answer = quizAnswers[name];
            if (Array.isArray(answer)) {
                isValid = answer.length > 0;
            } else if (typeof answer === 'string') {
                isValid = answer.trim() !== '';
            } else {
                isValid = !!answer;
            }
        }
        
        nextBtn.disabled = !isValid;
        return isValid;
    }

    function addInputListeners() {
        const inputs = stepsContainer.querySelectorAll('input, textarea');
        inputs.forEach(input => {
            input.addEventListener('input', () => {
                saveAnswer();
                validateStep();
            });
            if(input.type === 'checkbox' || input.type === 'radio') {
                 input.addEventListener('change', () => {
                    const parent = input.closest('label');
                    if (input.type === 'radio') {
                        // Снимаем выделение со всех label в группе, чтобы подсветить только один
                        const groupName = input.name;
                        document.querySelectorAll(`input[name="${groupName}"]`).forEach(radio => {
                            const label = radio.closest('label');
                            // Сбрасываем стили для неактивных радио-кнопок
                            label.classList.remove('bg-primary', 'text-white', 'border-primary');
                            label.classList.add('border-gray-300', 'dark:border-gray-600');
                        });
                    }
                    
                    // Управляем стилями в зависимости от состояния checked
                    if (input.checked) {
                        parent.classList.add('bg-primary', 'text-white', 'border-primary');
                        parent.classList.remove('border-gray-300', 'dark:border-gray-600');
                    } else {
                        // Это актуально для чекбоксов
                        parent.classList.remove('bg-primary', 'text-white', 'border-primary');
                        parent.classList.add('border-gray-300', 'dark:border-gray-600');
                    }

                    saveAnswer();
                    validateStep();
                });
            }
        });
    }

    // --- Navigation ---
    function goToNextStep() {
        if (validateStep()) {
            currentStep++;
            updateDisplay();
        }
    }

    function goToPrevStep() {
        if (currentStep > 0) {
            currentStep--;
            updateDisplay();
        }
    }

    prevBtn.addEventListener('click', goToPrevStep);
    nextBtn.addEventListener('click', goToNextStep);
    submitBtn.addEventListener('click', () => {
        // Здесь будет логика отправки данных (quizAnswers) на сервер
        console.log('Отправка данных:', quizAnswers);
        currentStep++; // Переход на страницу "Спасибо"
        updateDisplay();
    });

    // --- Initialization ---
    updateDisplay();
}); 