/**
 * AI绘本故事应用 - 主要逻辑
 * 面向3-8岁儿童的AI故事生成、配图和朗读应用
 */

class StoryBookApp {
    constructor() {
        this.currentStory = null;
        this.currentParagraphIndex = 0;
        this.isPlaying = false;
        this.speechSynthesis = window.speechSynthesis;
        this.currentUtterance = null;
        this.sentences = [];
        this.currentSentenceIndex = 0;
        
        // API配置
        this.volcanoAPI = {
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
            key: '893b9f2c-3b3c-4943-a482-5ab6dde65007',
            model: 'deepseek-r1-250528'
        };
        
        this.aliAPI = {
            key: 'sk-b4e340d0f9d44156b1086eed3630a2e0',
            url: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis'
        };
        
        // 初始化图片库
        this.imageLibrary = new ImageLibrary();
        
        this.initializeApp();
    }
    
    /**
     * 初始化应用
     */
    initializeApp() {
        this.bindEvents();
        this.setupTTS();
        this.showSection('storyCreator');
        console.log('AI绘本故事应用已初始化');
    }
    
    /**
     * 绑定事件监听器
     */
    bindEvents() {
        // 生成故事按钮
        const generateBtn = document.getElementById('generateStoryBtn');
        generateBtn.addEventListener('click', () => this.generateStory());
        
        // 回车键提交
        const storyInput = document.getElementById('storyTheme');
        storyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.generateStory();
            }
        });
        
        // 播放控制按钮
        document.getElementById('playPauseBtn').addEventListener('click', () => this.togglePlayPause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stopReading());
        document.getElementById('regenerateBtn').addEventListener('click', () => this.regenerateStory());
        
        // 错误模态框
        document.getElementById('closeErrorModal').addEventListener('click', () => this.hideModal('errorModal'));
        document.getElementById('confirmError').addEventListener('click', () => this.hideModal('errorModal'));
        
        // 点击模态框背景关闭
        document.getElementById('errorModal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('errorModal')) {
                this.hideModal('errorModal');
            }
        });
    }
    
    /**
     * 设置文本转语音
     */
    setupTTS() {
        // 检查浏览器支持
        if (!('speechSynthesis' in window)) {
            console.warn('浏览器不支持语音合成功能');
            return;
        }
        
        // 等待语音列表加载
        const loadVoices = () => {
            const voices = this.speechSynthesis.getVoices();
            console.log('可用语音列表：', voices.map(v => `${v.name} (${v.lang})`));
        };
        
        if (this.speechSynthesis.getVoices().length === 0) {
            this.speechSynthesis.addEventListener('voiceschanged', loadVoices);
        } else {
            loadVoices();
        }
    }
    
    /**
     * 生成故事
     */
    async generateStory() {
        const themeInput = document.getElementById('storyTheme');
        const theme = themeInput.value.trim();
        
        if (!theme) {
            this.showError('请先输入故事主题哦~');
            return;
        }
        
        try {
            this.setGenerating(true);
            this.showSection('loadingSection');
            this.updateLoadingText('正在为你创作故事...');
            
            // 生成故事内容
            const storyData = await this.callStoryAPI(theme);
            if (!storyData) {
                throw new Error('故事生成失败');
            }
            
            this.currentStory = storyData;
            this.updateLoadingText('故事创作完成！正在生成精美插图...');
            
            // 生成配图
            await this.generateImages(storyData.paragraphs);
            
            // 显示故事
            this.displayStory(storyData);
            this.showSection('storyDisplay');
            
            // 重置状态
            this.currentParagraphIndex = 0;
            this.currentSentenceIndex = 0;
            this.updateProgress();
            
        } catch (error) {
            console.error('生成故事时出错：', error);
            this.showError('哎呀，创作故事时遇到了问题，请稍后再试试吧~');
            this.showSection('storyCreator');
        } finally {
            this.setGenerating(false);
        }
    }
    
    /**
     * 调用故事生成API
     */
    async callStoryAPI(theme) {
        const prompt = `你是一名专业的儿童故事播客剧本创作者，请根据用户提供的故事主题或角色设定等要求，创作一个适合单人口播的儿童故事播客剧本逐字稿。
【播客目标】
根据用户要求为3-8岁的儿童生成小故事，用于AI播客自动朗读。
【语言风格要求】
- 用词一定要口语化、适合TTS朗读，节奏自然，可用逗号、句号、感叹号等帮助TTS表现语气。
- 剧本用词要易于理解，多用简短句子，不要使用书面及高难度词汇，使用的词汇要是3-8岁的儿童可以理解的
- 故事和语言风格生动有趣，可以适当加入拟声词和合理的情绪化表达（如"咚咚咚""哇——"）
- 故事整体要积极、活泼、温暖、有趣，氛围轻松安全。
- 不使用舞台指令或括号说明，所有情绪和动作通过文字自然呈现。

请根据用户要求生成绘本剧本，故事要包含5-8个段落，每个段落大约2-3句话。用户的故事主题是：${theme}

请返回JSON格式的结果，包含title（故事标题）和paragraphs（段落数组，每个段落包含text字段）。`;
        
        try {
            const response = await fetch(this.volcanoAPI.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.volcanoAPI.key}`
                },
                body: JSON.stringify({
                    model: this.volcanoAPI.model,
                    messages: [
                        {
                            role: "system",
                            content: "你是人工智能助手."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    temperature: 0.8,
                    max_tokens: 2000
                })
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.choices[0]?.message?.content;
            
            if (!content) {
                throw new Error('API返回内容为空');
            }
            
            // 尝试解析JSON响应
            let storyData;
            try {
                // 寻找JSON内容
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    storyData = JSON.parse(jsonMatch[0]);
                } else {
                    // 如果没有JSON格式，则手动构建故事数据
                    storyData = this.parseTextToStory(content, theme);
                }
            } catch (parseError) {
                console.warn('解析JSON失败，尝试文本解析:', parseError);
                storyData = this.parseTextToStory(content, theme);
            }
            
            // 验证故事数据格式
            if (!storyData.title || !storyData.paragraphs || !Array.isArray(storyData.paragraphs)) {
                throw new Error('故事数据格式不正确');
            }
            
            return storyData;
            
        } catch (error) {
            console.error('调用故事API失败：', error);
            throw error;
        }
    }
    
    /**
     * 解析文本内容为故事数据
     */
    parseTextToStory(content, theme) {
        const lines = content.split('\n').filter(line => line.trim());
        let title = `${theme}的故事`;
        const paragraphs = [];
        
        // 寻找标题
        const titleLine = lines.find(line => 
            line.includes('标题') || line.includes('题目') || line.includes('#')
        );
        if (titleLine) {
            title = titleLine.replace(/^[#*\s]*(?:标题|题目)[：:]*\s*/, '').trim();
        }
        
        // 将内容分割成段落
        let currentParagraph = '';
        for (const line of lines) {
            if (line.trim() && !line.includes('标题') && !line.includes('题目')) {
                currentParagraph += line.trim() + ' ';
                
                // 如果段落足够长或遇到明显的分段标志，则结束当前段落
                if (currentParagraph.length > 100 || line.includes('。') || line.includes('！')) {
                    if (currentParagraph.trim().length > 20) {
                        paragraphs.push({ text: currentParagraph.trim() });
                        currentParagraph = '';
                    }
                }
            }
        }
        
        // 添加最后的段落
        if (currentParagraph.trim().length > 20) {
            paragraphs.push({ text: currentParagraph.trim() });
        }
        
        // 确保至少有5个段落
        if (paragraphs.length < 5) {
            const sampleTexts = [
                '从前，有一个非常有趣的地方。那里住着很多可爱的小动物。',
                '有一天，小动物们决定一起去冒险。他们带上了所有需要的东西。',
                '路上，他们遇到了很多有趣的事情。每个小动物都表现得很勇敢。',
                '最后，他们成功完成了冒险。所有的小动物都非常开心。',
                '从此以后，他们成为了最好的朋友。这就是一个关于友谊的美好故事。'
            ];
            
            while (paragraphs.length < 5) {
                paragraphs.push({ text: sampleTexts[paragraphs.length % sampleTexts.length] });
            }
        }
        
        return { title, paragraphs };
    }
    
    /**
     * 生成故事配图
     */
    async generateImages(paragraphs) {
        // 先设置占位图，让用户能看到故事结构
        paragraphs.forEach((paragraph, index) => {
            paragraph.image = this.createPlaceholderImage(index + 1);
        });
        
        // 并行生成图片（提高速度）
        const imagePromises = paragraphs.map(async (paragraph, i) => {
            try {
                this.updateLoadingText(`正在生成第 ${i + 1} 幅插图...`);
                
                // 为每个段落生成描述性的图像提示
                const imagePrompt = this.createImagePrompt(paragraph.text);
                console.log(`生成第${i + 1}幅图片，提示词:`, imagePrompt);
                
                const imageUrl = await this.callImageAPI(imagePrompt, paragraph.text, i);
                
                if (imageUrl) {
                    paragraphs[i].image = imageUrl;
                    console.log(`第${i + 1}幅图片生成成功:`, imageUrl);
                } else {
                    console.warn(`第${i + 1}幅图片生成失败，使用占位图`);
                    // 使用图片库的SVG图片
                    paragraphs[i].image = this.imageLibrary.createColorfulSVG(paragraph.text, i);
                }
                
                return i;
                
            } catch (error) {
                console.error(`生成第${i + 1}幅图片失败:`, error);
                // 使用图片库的SVG图片
                paragraphs[i].image = this.imageLibrary.createColorfulSVG(paragraph.text, i);
                return i;
            }
        });
        
        // 等待所有图片生成完成
        await Promise.all(imagePromises);
        
        this.updateLoadingText('所有插图生成完成！');
    }
    
    /**
     * 创建图像生成提示词
     */
    createImagePrompt(text) {
        // 基础的儿童绘本风格描述
        const baseStyle = "Children's book illustration, cartoon style, bright colors, cute and friendly, watercolor painting style, safe and warm atmosphere";
        
        // 从文本中提取关键信息来生成图像描述
        let sceneDescription = "";
        
        // 简单的关键词匹配来生成场景描述
        if (text.includes('森林') || text.includes('树')) {
            sceneDescription = "magical forest with colorful trees and flowers";
        } else if (text.includes('海') || text.includes('水')) {
            sceneDescription = "beautiful ocean scene with gentle waves";
        } else if (text.includes('家') || text.includes('房')) {
            sceneDescription = "cozy home with warm lighting";
        } else if (text.includes('动物') || text.includes('小兔') || text.includes('小猫')) {
            sceneDescription = "cute animals playing together in a garden";
        } else if (text.includes('天空') || text.includes('云')) {
            sceneDescription = "beautiful sky with fluffy clouds";
        } else {
            sceneDescription = "happy children's scene with bright sunshine";
        }
        
        return `${baseStyle}, ${sceneDescription}`;
    }
    
    /**
     * 调用图像生成API（支持多种后备方案）
     */
    async callImageAPI(prompt, text, index) {
        // 方案1：尝试阿里云API
        try {
            const result = await this.callAliyunImageAPI(prompt);
            if (result) {
                return result;
            }
        } catch (error) {
            console.warn('阿里云API失败，尝试其他方案:', error);
        }
        
        // 方案2：使用图片库智能匹配
        try {
            console.log('使用图片库智能匹配...');
            return await this.imageLibrary.getFallbackImage(text, index);
        } catch (error) {
            console.warn('图片库匹配失败:', error);
        }
        
        // 方案3：使用高级占位图
        return this.createAdvancedPlaceholder(prompt, index);
    }
    
    /**
     * 调用阿里云图像生成API
     */
    async callAliyunImageAPI(prompt) {
        const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.aliAPI.key}`,
                'X-DashScope-Async': 'enable'
            },
            body: JSON.stringify({
                model: 'wanx-v1',
                input: {
                    prompt: prompt,
                    negative_prompt: 'scary, dark, violent, inappropriate for children, adult content',
                    size: '1024*1024',
                    n: 1,
                    seed: Math.floor(Math.random() * 1000000),
                    style: '<cartoon>'
                },
                parameters: {
                    size: '1024*1024',
                    n: 1
                }
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`阿里云API请求失败: ${response.status}`, errorText);
            throw new Error(`阿里云API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('阿里云API响应:', data);
        
        // 处理异步任务响应
        if (data.output && data.output.task_id) {
            return await this.pollImageResult(data.output.task_id);
        } else if (data.output && data.output.results && data.output.results.length > 0) {
            return data.output.results[0].url;
        } else {
            throw new Error('阿里云API响应格式错误');
        }
    }
    
    /**
     * 调用内置图片生成API（备用方案）
     */
    async callBuiltinImageAPI(prompt) {
        // 如果有可用的内置图片生成API，在这里调用
        // 这是一个备用方案，可以集成其他图片生成服务
        throw new Error('内置图片生成暂不可用');
    }
    
    /**
     * 创建高级占位图
     */
    createAdvancedPlaceholder(prompt, index = 0) {
        // 使用图片库的彩色SVG功能
        return this.imageLibrary.createColorfulSVG(prompt || '美丽的故事插图', index);
    }
    
    /**
     * 轮询图像生成结果
     */
    async pollImageResult(taskId, maxAttempts = 10) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                await this.sleep(2000); // 等待2秒
                
                const response = await fetch(`https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${this.aliAPI.key}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`轮询任务失败: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('轮询结果:', data);
                
                if (data.output && data.output.task_status === 'SUCCEEDED') {
                    if (data.output.results && data.output.results.length > 0) {
                        return data.output.results[0].url;
                    }
                } else if (data.output && data.output.task_status === 'FAILED') {
                    throw new Error('图像生成任务失败');
                }
                
                // 继续轮询
            } catch (error) {
                console.error(`轮询第${attempt + 1}次失败:`, error);
                if (attempt === maxAttempts - 1) {
                    throw error;
                }
            }
        }
        
        throw new Error('图像生成超时');
    }
    
    /**
     * 创建占位图片
     */
    createPlaceholderImage(index) {
        // 创建一个简单的SVG占位图
        const colors = ['#FFB6C1', '#87CEEB', '#98FB98', '#DDA0DD', '#F0E68C'];
        const color = colors[index % colors.length];
        
        const svg = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <rect width="100%" height="100%" fill="${color}"/>
                <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="24" font-family="Arial">
                    🎨
                </text>
                <text x="50%" y="60%" text-anchor="middle" fill="white" font-size="14" font-family="Arial">
                    第 ${index} 幅插图
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    }
    
    /**
     * 显示故事内容
     */
    displayStory(storyData) {
        const storyTitle = document.getElementById('storyTitle');
        const storyContent = document.getElementById('storyContent');
        
        storyTitle.textContent = storyData.title;
        storyContent.innerHTML = '';
        
        storyData.paragraphs.forEach((paragraph, index) => {
            const paragraphDiv = document.createElement('div');
            paragraphDiv.className = 'story-paragraph';
            paragraphDiv.dataset.index = index;
            
            // 创建文本元素
            const textDiv = document.createElement('div');
            textDiv.className = 'paragraph-text';
            textDiv.textContent = paragraph.text;
            
            // 创建图片元素
            const imageDiv = document.createElement('div');
            imageDiv.className = 'paragraph-image';
            
            if (paragraph.image) {
                if (paragraph.image.startsWith('data:image/svg+xml')) {
                    // 对于SVG占位图，创建img元素
                    const img = document.createElement('img');
                    img.src = paragraph.image;
                    img.alt = `第${index + 1}段插图`;
                    img.style.width = '100%';
                    img.style.height = 'auto';
                    imageDiv.appendChild(img);
                } else {
                    // 对于真实图片，创建img元素
                    const img = document.createElement('img');
                    img.src = paragraph.image;
                    img.alt = `第${index + 1}段插图`;
                    img.onerror = () => {
                        imageDiv.innerHTML = '🖼️ 图片加载失败';
                    };
                    imageDiv.appendChild(img);
                }
            } else {
                imageDiv.innerHTML = '🎨 正在生成插图...';
                imageDiv.classList.add('loading');
            }
            
            paragraphDiv.appendChild(textDiv);
            paragraphDiv.appendChild(imageDiv);
            storyContent.appendChild(paragraphDiv);
        });
        
        // 准备TTS内容
        this.prepareTTSContent(storyData);
    }
    
    /**
     * 准备TTS朗读内容
     */
    prepareTTSContent(storyData) {
        this.sentences = [];
        
        storyData.paragraphs.forEach((paragraph, paragraphIndex) => {
            // 将段落文本按句号分割成句子
            const sentences = paragraph.text.split(/[。！？]/).filter(s => s.trim());
            
            sentences.forEach(sentence => {
                if (sentence.trim()) {
                    this.sentences.push({
                        text: sentence.trim() + '。',
                        paragraphIndex: paragraphIndex
                    });
                }
            });
        });
        
        console.log('TTS内容已准备，共', this.sentences.length, '个句子');
    }
    
    /**
     * 切换播放/暂停
     */
    togglePlayPause() {
        if (this.isPlaying) {
            this.pauseReading();
        } else {
            this.startReading();
        }
    }
    
    /**
     * 开始朗读
     */
    startReading() {
        if (!this.currentStory || !this.sentences.length) {
            this.showError('请先生成故事哦~');
            return;
        }
        
        this.isPlaying = true;
        this.updatePlayButton();
        
        // 从当前位置开始朗读
        this.readNextSentence();
    }
    
    /**
     * 朗读下一个句子
     */
    readNextSentence() {
        if (!this.isPlaying || this.currentSentenceIndex >= this.sentences.length) {
            this.stopReading();
            return;
        }
        
        const currentSentence = this.sentences[this.currentSentenceIndex];
        const paragraphIndex = currentSentence.paragraphIndex;
        
        // 更新当前段落高亮
        this.highlightCurrentParagraph(paragraphIndex);
        
        // 创建语音合成
        this.currentUtterance = new SpeechSynthesisUtterance(currentSentence.text);
        
        // 设置语音参数
        const voices = this.speechSynthesis.getVoices();
        const chineseVoice = voices.find(voice => 
            voice.lang.includes('zh') || voice.name.includes('Chinese')
        );
        
        if (chineseVoice) {
            this.currentUtterance.voice = chineseVoice;
        }
        
        this.currentUtterance.rate = 0.9;  // 稍慢的语速，适合儿童
        this.currentUtterance.pitch = 1.1; // 稍高的音调，更有趣
        this.currentUtterance.volume = 1.0;
        
        // 监听朗读事件
        this.currentUtterance.onstart = () => {
            this.highlightCurrentSentence(currentSentence.text, paragraphIndex);
        };
        
        this.currentUtterance.onend = () => {
            this.currentSentenceIndex++;
            this.updateProgress();
            
            // 短暂暂停后朗读下一句
            setTimeout(() => {
                if (this.isPlaying) {
                    this.readNextSentence();
                }
            }, 500);
        };
        
        this.currentUtterance.onerror = (event) => {
            console.error('语音合成出错：', event.error);
            this.currentSentenceIndex++;
            if (this.isPlaying) {
                this.readNextSentence();
            }
        };
        
        // 开始朗读
        this.speechSynthesis.speak(this.currentUtterance);
    }
    
    /**
     * 暂停朗读
     */
    pauseReading() {
        this.isPlaying = false;
        this.speechSynthesis.pause();
        this.updatePlayButton();
    }
    
    /**
     * 停止朗读
     */
    stopReading() {
        this.isPlaying = false;
        this.speechSynthesis.cancel();
        this.currentSentenceIndex = 0;
        this.updateProgress();
        this.updatePlayButton();
        this.clearHighlights();
    }
    
    /**
     * 高亮当前段落
     */
    highlightCurrentParagraph(paragraphIndex) {
        // 清除所有段落高亮
        document.querySelectorAll('.story-paragraph').forEach(p => {
            p.classList.remove('active');
        });
        
        // 高亮当前段落
        const currentParagraph = document.querySelector(`.story-paragraph[data-index="${paragraphIndex}"]`);
        if (currentParagraph) {
            currentParagraph.classList.add('active');
            currentParagraph.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * 高亮当前句子
     */
    highlightCurrentSentence(sentenceText, paragraphIndex) {
        const paragraphElement = document.querySelector(`.story-paragraph[data-index="${paragraphIndex}"] .paragraph-text`);
        if (!paragraphElement) return;
        
        const fullText = paragraphElement.textContent;
        const sentenceStart = fullText.indexOf(sentenceText);
        
        if (sentenceStart !== -1) {
            const beforeText = fullText.substring(0, sentenceStart);
            const currentText = sentenceText;
            const afterText = fullText.substring(sentenceStart + sentenceText.length);
            
            paragraphElement.innerHTML = `
                ${this.escapeHtml(beforeText)}
                <span class="highlight">${this.escapeHtml(currentText)}</span>
                ${this.escapeHtml(afterText)}
            `;
        }
    }
    
    /**
     * 清除所有高亮
     */
    clearHighlights() {
        document.querySelectorAll('.story-paragraph').forEach(paragraph => {
            paragraph.classList.remove('active');
            const textElement = paragraph.querySelector('.paragraph-text');
            if (textElement && textElement.querySelector('.highlight')) {
                textElement.innerHTML = textElement.textContent;
            }
        });
    }
    
    /**
     * 更新播放按钮状态
     */
    updatePlayButton() {
        const playBtn = document.getElementById('playPauseBtn');
        const icon = playBtn.querySelector('i');
        
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
            playBtn.classList.add('active');
        } else {
            icon.className = 'fas fa-play';
            playBtn.classList.remove('active');
        }
    }
    
    /**
     * 更新进度显示
     */
    updateProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const progress = this.sentences.length > 0 ? 
            (this.currentSentenceIndex / this.sentences.length) * 100 : 0;
        
        progressFill.style.width = `${progress}%`;
        progressText.textContent = `${this.currentSentenceIndex} / ${this.sentences.length}`;
    }
    
    /**
     * 重新生成故事
     */
    async regenerateStory() {
        const themeInput = document.getElementById('storyTheme');
        if (themeInput.value.trim()) {
            this.stopReading();
            await this.generateStory();
        }
    }
    
    /**
     * 设置生成状态
     */
    setGenerating(isGenerating) {
        const generateBtn = document.getElementById('generateStoryBtn');
        const spinner = generateBtn.querySelector('.loading-spinner');
        const text = generateBtn.querySelector('span');
        
        generateBtn.disabled = isGenerating;
        
        if (isGenerating) {
            spinner.classList.remove('hidden');
            text.textContent = '正在创作中...';
        } else {
            spinner.classList.add('hidden');
            text.textContent = '开始创作故事';
        }
    }
    
    /**
     * 显示指定区域
     */
    showSection(sectionId) {
        const sections = ['storyCreator', 'storyDisplay', 'loadingSection'];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (id === sectionId) {
                element.classList.remove('hidden');
            } else {
                element.classList.add('hidden');
            }
        });
        
        // 显示故事卡片
        if (sectionId === 'storyDisplay') {
            const storyCard = document.querySelector('.story-card');
            storyCard.classList.remove('hidden');
        }
    }
    
    /**
     * 更新加载文本
     */
    updateLoadingText(text) {
        const loadingText = document.getElementById('loadingText');
        if (loadingText) {
            loadingText.textContent = text;
        }
    }
    
    /**
     * 显示错误信息
     */
    showError(message) {
        const errorModal = document.getElementById('errorModal');
        const errorMessage = document.getElementById('errorMessage');
        
        errorMessage.textContent = message;
        this.showModal('errorModal');
    }
    
    /**
     * 显示模态框
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('hidden');
        
        // 聚焦到模态框以支持键盘导航
        modal.focus();
    }
    
    /**
     * 隐藏模态框
     */
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('hidden');
    }
    
    /**
     * HTML转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    /**
     * 延迟函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 应用启动
document.addEventListener('DOMContentLoaded', () => {
    window.storyApp = new StoryBookApp();
});

// 防止页面意外刷新时丢失正在播放的状态
window.addEventListener('beforeunload', (event) => {
    if (window.storyApp && window.storyApp.isPlaying) {
        event.preventDefault();
        event.returnValue = '故事正在播放中，确定要离开吗？';
        return event.returnValue;
    }
});

// 处理页面可见性变化
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.storyApp && window.storyApp.isPlaying) {
        // 页面隐藏时暂停播放
        window.storyApp.pauseReading();
    }
});