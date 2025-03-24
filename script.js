document.addEventListener('DOMContentLoaded', () => {
    // متغیرهای سراسری
    let selectedModel = '';
    let availableModels = [];
    let isAPIConnected = false;
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory') || '[]');
    let controller = null; // برای کنترل درخواست‌های fetch

    // انتخاب المان‌های DOM
    const themeToggle = document.getElementById('themeToggle');
    const apiKeyInput = document.getElementById('apiKey');
    const toggleVisibilityBtn = document.getElementById('toggleVisibility');
    const testConnectionBtn = document.getElementById('testConnection');
    const connectionIndicator = document.getElementById('connectionIndicator');
    const connectionStatus = document.getElementById('connectionStatus');
    const modelSelect = document.getElementById('model');
    const modelSearch = document.getElementById('modelSearch');
    const confirmModelBtn = document.getElementById('confirmModel');
    const generateBtn = document.getElementById('generateBtn');
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');
    const copyBtn = document.getElementById('copyBtn');
    const saveBtn = document.getElementById('saveBtn');
    const saveWord = document.getElementById('saveWord');
    const saveSRT = document.getElementById('saveSRT');
    const savePDF = document.getElementById('savePDF');
    const customLengthInput = document.getElementById('customLength');
    const lengthRadios = document.querySelectorAll('input[name="length"]');
    const topicInput = document.getElementById('topic');
    const keywordsInput = document.getElementById('keywords');

    // شمارنده کلمات
    let wordCounterElement = null;

    // بارگذاری کلید API ذخیره شده
    const savedApiKey = localStorage.getItem('apiKey');
    if (savedApiKey) {
        apiKeyInput.value = savedApiKey;
        // آزمایش اتصال اتوماتیک اگر کلید API موجود باشد
        testConnectionBtn.click();
    }

    // تنظیم کردن حالت تاریک/روشن
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.querySelector('i').classList.remove('fa-moon');
        themeToggle.querySelector('i').classList.add('fa-sun');
    }

    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const icon = themeToggle.querySelector('i');
        if (document.body.classList.contains('dark-mode')) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    });

    // نمایش/مخفی کردن کلید API
    toggleVisibilityBtn.addEventListener('click', () => {
        const icon = toggleVisibilityBtn.querySelector('i');
        if (apiKeyInput.type === 'password') {
            apiKeyInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            apiKeyInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    // ذخیره کلید API هنگام تغییر
    apiKeyInput.addEventListener('change', () => {
        localStorage.setItem('apiKey', apiKeyInput.value.trim());
    });

    // اضافه کردن شمارنده کلمات به کادر نتیجه
    function addWordCounter() {
        if (!wordCounterElement) {
            wordCounterElement = document.createElement('div');
            wordCounterElement.className = 'word-counter';
            wordCounterElement.textContent = '۰ کلمه';
            resultSection.appendChild(wordCounterElement);
        }
    }
    
    // شمارش تعداد کلمات
    function countWords(text) {
        if (!text || text.trim() === '') return 0;
        // حذف فاصله‌های اضافی و شمارش کلمات
        return text.trim().split(/\s+/).length;
    }
    
    // به‌روزرسانی شمارنده کلمات
    function updateWordCount(text) {
        if (wordCounterElement) {
            const count = countWords(text);
            // تبدیل اعداد به فارسی
            const persianCount = count.toLocaleString('fa-IR');
            wordCounterElement.textContent = `${persianCount} کلمه`;
        }
    }

    // ایجاد لیست تاریخچه جستجو
    function createSearchHistoryList() {
        // اضافه کردن المان‌های DOM برای تاریخچه جستجو
        const topicContainer = topicInput.parentElement;
        let historyContainer = document.querySelector('.search-history');
        
        if (!historyContainer) {
            historyContainer = document.createElement('div');
            historyContainer.className = 'search-history';
            historyContainer.style.display = 'none';
            topicContainer.appendChild(historyContainer);
            
            // استایل برای کانتینر تاریخچه
            const searchHistoryStyle = document.createElement('style');
            searchHistoryStyle.textContent = `
                .search-history {
                    max-height: 150px;
                    overflow-y: auto;
                    background-color: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 0 0 var(--border-radius) var(--border-radius);
                    position: absolute;
                    width: 100%;
                    z-index: 5;
                    margin-top: -1px;
                    box-shadow: var(--shadow);
                }
                .search-history-item {
                    padding: 8px 15px;
                    cursor: pointer;
                    border-bottom: 1px solid var(--border-color);
                }
                .search-history-item:last-child {
                    border-bottom: none;
                }
                .search-history-item:hover {
                    background-color: var(--bg-color);
                }
                .search-history-item .keywords {
                    font-size: 0.8em;
                    color: var(--text-color-light);
                    margin-top: 3px;
                }
                .search-history-clear {
                    text-align: center;
                    padding: 5px;
                    font-size: 0.8em;
                    color: var(--text-color-light);
                    background-color: var(--bg-color);
                    cursor: pointer;
                }
                .search-history-clear:hover {
                    color: var(--error-color);
                }
                .word-counter {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background-color: var(--primary-color);
                    color: white;
                    padding: 3px 8px;
                    border-radius: 12px;
                    font-size: 0.8rem;
                    opacity: 0.8;
                    z-index: 10;
                }
                .result-section {
                    position: relative;
                }
                .result-content {
                    padding-bottom: 30px !important;
                }
            `;
            document.head.appendChild(searchHistoryStyle);
        }
        
        updateSearchHistoryDisplay();
    }

    // بروزرسانی نمایش تاریخچه جستجو
    function updateSearchHistoryDisplay() {
        const historyContainer = document.querySelector('.search-history');
        if (!historyContainer) return;
        
        historyContainer.innerHTML = '';
        
        // اگر تاریخچه‌ای وجود داشته باشد
        if (searchHistory.length > 0) {
            // نمایش آیتم‌های تاریخچه
            searchHistory.slice(0, 5).forEach(item => {
                const historyItem = document.createElement('div');
                historyItem.className = 'search-history-item';
                historyItem.innerHTML = `
                    <div>${item.topic}</div>
                    ${item.keywords ? `<div class="keywords">کلمات کلیدی: ${item.keywords}</div>` : ''}
                `;
                
                historyItem.addEventListener('click', () => {
                    topicInput.value = item.topic;
                    keywordsInput.value = item.keywords || '';
                    historyContainer.style.display = 'none';
                });
                
                historyContainer.appendChild(historyItem);
            });
            
            // اضافه کردن دکمه پاک کردن تاریخچه
            const clearButton = document.createElement('div');
            clearButton.className = 'search-history-clear';
            clearButton.textContent = 'پاک کردن تاریخچه';
            clearButton.addEventListener('click', (e) => {
                e.stopPropagation();
                searchHistory = [];
                localStorage.removeItem('searchHistory');
                updateSearchHistoryDisplay();
                historyContainer.style.display = 'none';
            });
            
            historyContainer.appendChild(clearButton);
        } else {
            const emptyMessage = document.createElement('div');
            emptyMessage.className = 'search-history-item';
            emptyMessage.textContent = 'تاریخچه‌ای وجود ندارد';
            historyContainer.appendChild(emptyMessage);
        }
    }

    // نمایش/مخفی کردن تاریخچه جستجو
    topicInput.addEventListener('focus', () => {
        const historyContainer = document.querySelector('.search-history');
        if (historyContainer && searchHistory.length > 0) {
            historyContainer.style.display = 'block';
        }
    });

    topicInput.addEventListener('input', () => {
        const historyContainer = document.querySelector('.search-history');
        const searchTerm = topicInput.value.trim().toLowerCase();
        
        if (historyContainer) {
            if (searchTerm === '') {
                // نمایش همه موارد تاریخچه
                updateSearchHistoryDisplay();
                historyContainer.style.display = searchHistory.length > 0 ? 'block' : 'none';
            } else {
                // فیلتر موارد تاریخچه
                const filteredHistory = searchHistory.filter(
                    item => item.topic.toLowerCase().includes(searchTerm) || 
                           (item.keywords && item.keywords.toLowerCase().includes(searchTerm))
                );
                
                if (filteredHistory.length > 0) {
                    historyContainer.innerHTML = '';
                    filteredHistory.slice(0, 5).forEach(item => {
                        const historyItem = document.createElement('div');
                        historyItem.className = 'search-history-item';
                        historyItem.innerHTML = `
                            <div>${item.topic}</div>
                            ${item.keywords ? `<div class="keywords">کلمات کلیدی: ${item.keywords}</div>` : ''}
                        `;
                        
                        historyItem.addEventListener('click', () => {
                            topicInput.value = item.topic;
                            keywordsInput.value = item.keywords || '';
                            historyContainer.style.display = 'none';
                        });
                        
                        historyContainer.appendChild(historyItem);
                    });
                    historyContainer.style.display = 'block';
                } else {
                    historyContainer.style.display = 'none';
                }
            }
        }
    });

    // مخفی کردن تاریخچه با کلیک بیرون از آن
    document.addEventListener('click', (e) => {
        const historyContainer = document.querySelector('.search-history');
        if (historyContainer && e.target !== topicInput && !historyContainer.contains(e.target)) {
            historyContainer.style.display = 'none';
        }
    });

    // آزمایش اتصال به API
    testConnectionBtn.addEventListener('click', async () => {
        const apiKey = apiKeyInput.value.trim();
        if (!apiKey) {
            updateConnectionStatus(false, 'لطفاً کلید API را وارد کنید.');
            return;
        }

        try {
            connectionStatus.textContent = 'در حال بررسی اتصال...';
            connectionIndicator.className = 'indicator';

            // استفاده از API مدل‌ها برای تست اتصال به جای endpoint خاص احراز هویت
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Content Generator App V2'
                }
            });

            if (response.ok) {
                updateConnectionStatus(true, 'اتصال موفقیت‌آمیز بود.');
                isAPIConnected = true;
                
                // ذخیره کلید API
                localStorage.setItem('apiKey', apiKey);
                
                // دریافت لیست مدل‌ها از پاسخ فعلی
                const data = await response.json();
                availableModels = data.data || [];
                populateModelSelect(availableModels);
            } else {
                let errorMessage = 'کلید API نامعتبر است.';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {}
                
                updateConnectionStatus(false, `خطا: ${errorMessage}`);
                isAPIConnected = false;
            }
        } catch (error) {
            updateConnectionStatus(false, `خطا در اتصال: ${error.message}`);
            isAPIConnected = false;
        }
    });

    // به‌روزرسانی وضعیت اتصال
    function updateConnectionStatus(success, message) {
        connectionIndicator.className = success ? 'indicator success' : 'indicator error';
        connectionStatus.textContent = message;
    }

    // دریافت لیست مدل‌ها از API (این تابع دیگر مستقیماً فراخوانی نمی‌شود)
    async function fetchModels(apiKey) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Content Generator App V2'
                }
            });

            if (response.ok) {
                const data = await response.json();
                availableModels = data.data || [];
                populateModelSelect(availableModels);
            } else {
                console.error('خطا در دریافت مدل‌ها:', await response.json());
            }
        } catch (error) {
            console.error('خطا در دریافت مدل‌ها:', error);
        }
    }

    // پر کردن کادر انتخاب مدل
    function populateModelSelect(models) {
        modelSelect.innerHTML = '';
        
        if (models.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'هیچ مدلی یافت نشد';
            option.disabled = true;
            option.selected = true;
            modelSelect.appendChild(option);
            return;
        }

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.provider})`;
            option.dataset.provider = model.provider;
            option.dataset.description = model.description || '';
            option.dataset.context_length = model.context_length || 'نامشخص';
            modelSelect.appendChild(option);
        });

        // انتخاب اولین مدل به عنوان پیش‌فرض
        if (models.length > 0) {
            modelSelect.value = models[0].id;
        }
        
        // بازیابی مدل ذخیره شده قبلی
        const savedModel = localStorage.getItem('selectedModel');
        if (savedModel && models.some(model => model.id === savedModel)) {
            modelSelect.value = savedModel;
            selectedModel = savedModel;
        }
    }

    // جستجو در لیست مدل‌ها
    modelSearch.addEventListener('input', () => {
        const searchTerm = modelSearch.value.toLowerCase();
        
        if (!availableModels.length) return;
        
        const filteredModels = availableModels.filter(model => 
            model.id.toLowerCase().includes(searchTerm) || 
            model.name.toLowerCase().includes(searchTerm) || 
            (model.provider && model.provider.toLowerCase().includes(searchTerm))
        );
        
        populateModelSelect(filteredModels);
    });

    // تایید انتخاب مدل
    confirmModelBtn.addEventListener('click', () => {
        selectedModel = modelSelect.value;
        if (selectedModel) {
            confirmModelBtn.innerHTML = '<i class="fas fa-check"></i> تایید شد';
            confirmModelBtn.classList.add('success');
            
            // ذخیره مدل انتخاب شده
            localStorage.setItem('selectedModel', selectedModel);
            
            setTimeout(() => {
                confirmModelBtn.innerHTML = 'تایید مدل';
                confirmModelBtn.classList.remove('success');
            }, 2000);
        } else {
            alert('لطفاً یک مدل را انتخاب کنید.');
        }
    });

    // فعال/غیرفعال کردن فیلد طول سفارشی
    lengthRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            customLengthInput.disabled = radio.id !== 'length-custom';
            if (radio.id === 'length-custom') {
                customLengthInput.focus();
            }
        });
    });

    // تولید محتوا
    generateBtn.addEventListener('click', async () => {
        if (!isAPIConnected) {
            alert('لطفاً ابتدا اتصال به API را برقرار کنید.');
            return;
        }

        if (!selectedModel) {
            alert('لطفاً یک مدل را انتخاب و تایید کنید.');
            return;
        }

        const topic = topicInput.value.trim();
        const keywords = keywordsInput.value.trim();
        
        if (!topic) {
            alert('لطفاً موضوع را وارد کنید.');
            return;
        }

        // اضافه کردن به تاریخچه جستجو
        addToSearchHistory(topic, keywords);

        // دریافت مقادیر فرم
        const tone = document.querySelector('input[name="tone"]:checked').value;
        const contentType = document.getElementById('contentType').value;
        const lengthType = document.querySelector('input[name="length"]:checked').value;
        const language = document.querySelector('input[name="language"]:checked').value;
        
        let wordCount = 0;
        if (lengthType === 'short') {
            wordCount = 250;
        } else if (lengthType === 'medium') {
            wordCount = 500;
        } else if (lengthType === 'long') {
            wordCount = 600;
        } else if (lengthType === 'custom') {
            wordCount = parseInt(customLengthInput.value) || 300;
        }

        // نمایش بخش نتیجه و پیام در حال بارگذاری
        resultSection.style.display = 'block';
        resultContent.innerHTML = '<div class="loading">در حال تولید محتوا... <i class="fas fa-spinner fa-spin"></i></div>';
        
        // اضافه کردن شمارنده کلمات
        addWordCounter();
        updateWordCount('');
        
        // اسکرول به بخش نتیجه
        resultSection.scrollIntoView({ behavior: 'smooth' });

        try {
            // لغو درخواست قبلی اگر در حال اجرا باشد
            if (controller) {
                controller.abort();
            }
            
            // ایجاد کنترلر جدید برای این درخواست
            controller = new AbortController();
            const signal = controller.signal;

            // ایجاد پیام برای API
            const languageText = language === 'persian' ? 'فارسی' : 'انگلیسی';
            const toneNames = {
                'friendly': 'دوستانه',
                'formal': 'رسمی',
                'casual': 'غیررسمی',
                'literary': 'ادبی',
                'creative': 'خلاقانه',
                'funny': 'خنده‌دار',
                'childish': 'کودکانه',
                'professional': 'حرفه‌ای'
            };
            
            const contentTypeNames = {
                'instagram': 'پست اینستاگرام',
                'shortStory': 'داستان کوتاه',
                'longStory': 'داستان بلند',
                'tweet': 'توییت',
                'comment': 'اظهارنظر',
                'message': 'پیام',
                'advertisement': 'تبلیغات',
                'blogPost': 'پست وبلاگ',
                'essay': 'انشا',
                'article': 'مقاله'
            };

            const prompt = `موضوع: ${topic}
کلمات کلیدی: ${keywords || 'ندارد'}
لحن: ${toneNames[tone]}
قالب: ${contentTypeNames[contentType]}
تعداد کلمات: حدود ${wordCount}
زبان: ${languageText}

یک ${contentTypeNames[contentType]} با موضوع "${topic}" به زبان ${languageText} با لحن ${toneNames[tone]} بنویس. سعی کن از کلمات کلیدی ${keywords || 'مرتبط با موضوع'} استفاده کنی و متن حدوداً ${wordCount} کلمه باشد.`;

            // بررسی پشتیبانی از stream
            try {
                const streamSupported = await checkStreamSupport(apiKeyInput.value.trim(), selectedModel);
                
                if (streamSupported) {
                    // استفاده از API با قابلیت stream
                    await streamContent(prompt, apiKeyInput.value.trim(), selectedModel, signal);
                } else {
                    // استفاده از روش معمولی بدون stream
                    await generateContentNormal(prompt, apiKeyInput.value.trim(), selectedModel, signal);
                }
            } catch (error) {
                // در صورت بروز خطا در بررسی stream، از روش معمولی استفاده می‌کنیم
                console.error('خطا در بررسی پشتیبانی از stream:', error);
                await generateContentNormal(prompt, apiKeyInput.value.trim(), selectedModel, signal);
            }
        } catch (error) {
            // اگر خطا به دلیل لغو عمدی درخواست نباشد، نمایش خطا
            if (error.name !== 'AbortError') {
                resultContent.innerHTML = `<div class="error">خطا در تولید محتوا: ${error.message}</div>`;
            }
        } finally {
            controller = null;
        }
    });

    // بررسی پشتیبانی از stream
    async function checkStreamSupport(apiKey, model) {
        try {
            const response = await fetch('https://openrouter.ai/api/v1/auth/key', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.href,
                    'X-Title': 'Content Generator App V2'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.stream || true; // فرض پشتیبانی از stream
            }
            return true; // در صورت عدم دسترسی به اطلاعات، فرض می‌کنیم stream پشتیبانی می‌شود
        } catch (e) {
            return true; // در صورت خطا، فرض می‌کنیم stream پشتیبانی می‌شود
        }
    }

    // تولید محتوا با stream
    async function streamContent(prompt, apiKey, model, signal) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Content Generator App V2'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'تو یک نویسنده حرفه‌ای هستی که می‌تواند انواع محتوا را در سبک‌ها و قالب‌های مختلف تولید کند.' },
                    { role: 'user', content: prompt }
                ],
                stream: true,
                max_tokens: 2000
            }),
            signal: signal
        });

        if (!response.ok) {
            let errorMessage = 'خطای ناشناخته';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {}
            
            resultContent.innerHTML = `<div class="error">خطا در تولید محتوا: ${errorMessage}</div>`;
            return;
        }

        // پاک کردن محتوای قبلی
        resultContent.textContent = '';

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            
            // پردازش داده‌های دریافتی
            const lines = chunk.split('\n');
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine === '') continue;
                if (trimmedLine === 'data: [DONE]') continue;
                
                if (trimmedLine.startsWith('data: ')) {
                    try {
                        const jsonData = JSON.parse(trimmedLine.slice(6));
                        if (jsonData.choices && jsonData.choices[0]?.delta?.content) {
                            const content = jsonData.choices[0].delta.content;
                            fullContent += content;
                            resultContent.textContent = fullContent;
                            // به‌روزرسانی تعداد کلمات به صورت زنده
                            updateWordCount(fullContent);
                            // اسکرول به پایین نتیجه
                            resultContent.scrollTop = resultContent.scrollHeight;
                        }
                    } catch (e) {
                        console.error('خطا در پردازش داده استریم:', e, trimmedLine);
                    }
                }
            }
        }
    }

    // تولید محتوا به روش معمولی
    async function generateContentNormal(prompt, apiKey, model, signal) {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'Content Generator App V2'
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: 'system', content: 'تو یک نویسنده حرفه‌ای هستی که می‌تواند انواع محتوا را در سبک‌ها و قالب‌های مختلف تولید کند.' },
                    { role: 'user', content: prompt }
                ],
                max_tokens: 2000
            }),
            signal: signal
        });

        if (response.ok) {
            const data = await response.json();
            const generatedContent = data.choices[0].message.content;
            resultContent.textContent = generatedContent;
            // به‌روزرسانی تعداد کلمات
            updateWordCount(generatedContent);
        } else {
            let errorMessage = 'خطای ناشناخته';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (e) {}
            
            resultContent.innerHTML = `<div class="error">خطا در تولید محتوا: ${errorMessage}</div>`;
        }
    }

    // افزودن به تاریخچه جستجو
    function addToSearchHistory(topic, keywords) {
        // بررسی تکراری نبودن
        const exists = searchHistory.some(item => 
            item.topic === topic && item.keywords === keywords
        );
        
        if (!exists) {
            // افزودن به ابتدای آرایه
            searchHistory.unshift({
                topic: topic,
                keywords: keywords,
                timestamp: new Date().getTime()
            });
            
            // محدود کردن تعداد آیتم‌ها
            if (searchHistory.length > 10) {
                searchHistory = searchHistory.slice(0, 10);
            }
            
            // ذخیره در localStorage
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            
            // بروزرسانی نمایش
            updateSearchHistoryDisplay();
        }
    }

    // کپی محتوای تولید شده
    copyBtn.addEventListener('click', () => {
        const text = resultContent.textContent;
        if (!text) return;

        navigator.clipboard.writeText(text)
            .then(() => {
                copyBtn.innerHTML = '<i class="fas fa-check"></i> کپی شد';
                setTimeout(() => {
                    copyBtn.innerHTML = '<i class="fas fa-copy"></i> کپی';
                }, 2000);
            })
            .catch(err => {
                console.error('خطا در کپی کردن متن:', err);
                alert('خطا در کپی کردن متن. لطفاً مجدداً تلاش کنید.');
            });
    });

    // ذخیره به فرمت Word
    saveWord.addEventListener('click', () => {
        const text = resultContent.textContent;
        if (!text) return;

        try {
            const { Document, Packer, Paragraph, TextRun } = docx;
            
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun(text)
                            ]
                        })
                    ]
                }]
            });

            Packer.toBlob(doc).then(blob => {
                saveAs(blob, `content-${new Date().getTime()}.docx`);
            });
        } catch (error) {
            console.error('خطا در ایجاد فایل Word:', error);
            alert('خطا در ایجاد فایل Word. لطفاً مجدداً تلاش کنید.');
        }
    });

    // ذخیره به فرمت SRT
    saveSRT.addEventListener('click', () => {
        const text = resultContent.textContent;
        if (!text) return;

        try {
            // تبدیل متن به فرمت SRT ساده
            const lines = text.split('\n');
            let srtContent = '';
            
            lines.forEach((line, index) => {
                if (line.trim() === '') return;
                
                const i = index + 1;
                const startTime = formatSRTTime(index * 3); // هر خط حدود 3 ثانیه
                const endTime = formatSRTTime((index + 1) * 3);
                
                srtContent += `${i}\n${startTime} --> ${endTime}\n${line}\n\n`;
            });
            
            const blob = new Blob([srtContent], { type: 'text/plain' });
            saveAs(blob, `subtitle-${new Date().getTime()}.srt`);
        } catch (error) {
            console.error('خطا در ایجاد فایل SRT:', error);
            alert('خطا در ایجاد فایل SRT. لطفاً مجدداً تلاش کنید.');
        }
    });

    // ذخیره به فرمت PDF
    savePDF.addEventListener('click', () => {
        const text = resultContent.textContent;
        if (!text) return;

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // تنظیم فونت برای پشتیبانی از فارسی
            doc.setFont('Helvetica');
            doc.setFontSize(12);
            
            // اضافه کردن متن به صورت راست به چپ
            doc.setR2L(true);
            
            const splitText = doc.splitTextToSize(text, 180);
            doc.text(splitText, 15, 20);
            
            doc.save(`content-${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('خطا در ایجاد فایل PDF:', error);
            alert('خطا در ایجاد فایل PDF. لطفاً مجدداً تلاش کنید.');
        }
    });

    // تابع کمکی برای فرمت زمان SRT
    function formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
    }

    // اضافه کردن کلاس استایل برای بخش لودینگ
    const style = document.createElement('style');
    style.textContent = `
        .loading {
            text-align: center;
            padding: 2rem;
            color: var(--text-color-light);
        }
        .error {
            color: var(--error-color);
            padding: 1rem;
            border: 1px solid var(--error-color);
            border-radius: var(--border-radius);
            background-color: rgba(220, 53, 69, 0.1);
        }
        .success {
            background-color: var(--success-color) !important;
        }
    `;
    document.head.appendChild(style);

    // ایجاد لیست تاریخچه جستجو
    createSearchHistoryList();
}); 