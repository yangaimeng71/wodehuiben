/**
 * 图片库管理模块
 * 提供备用图片方案和智能匹配功能
 */

class ImageLibrary {
    constructor() {
        // 预设的儿童友好图片库（使用免费的在线资源）
        this.imageCategories = {
            animals: [
                'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=400&h=300&fit=crop'
            ],
            nature: [
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1506260408121-e353d10b87c7?w=400&h=300&fit=crop'
            ],
            fantasy: [
                'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop'
            ],
            home: [
                'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop'
            ],
            adventure: [
                'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
                'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop'
            ]
        };
        
        // 关键词映射
        this.keywordMapping = {
            // 动物相关
            '动物': 'animals', '小兔': 'animals', '兔子': 'animals', 
            '小猫': 'animals', '猫咪': 'animals', '小狗': 'animals',
            '狗狗': 'animals', '小鸟': 'animals', '鸟儿': 'animals',
            
            // 自然相关
            '森林': 'nature', '树': 'nature', '花': 'nature',
            '草地': 'nature', '山': 'nature', '天空': 'nature',
            '云': 'nature', '太阳': 'nature', '月亮': 'nature',
            
            // 家庭相关
            '家': 'home', '房子': 'home', '房间': 'home',
            '床': 'home', '厨房': 'home', '客厅': 'home',
            
            // 冒险相关
            '冒险': 'adventure', '探险': 'adventure', '旅行': 'adventure',
            '路': 'adventure', '山峰': 'adventure', '海': 'adventure',
            
            // 魔法/奇幻相关
            '魔法': 'fantasy', '魔术': 'fantasy', '仙女': 'fantasy',
            '城堡': 'fantasy', '彩虹': 'fantasy', '星星': 'fantasy'
        };
    }
    
    /**
     * 根据文本内容智能选择图片
     * @param {string} text - 故事文本
     * @param {number} index - 段落索引
     * @returns {string} - 图片URL
     */
    getImageForText(text, index = 0) {
        // 分析文本中的关键词
        const category = this.analyzeTextCategory(text);
        
        // 获取对应分类的图片
        const images = this.imageCategories[category] || this.imageCategories.nature;
        
        // 根据索引选择图片（避免重复）
        const imageIndex = index % images.length;
        return images[imageIndex];
    }
    
    /**
     * 分析文本内容，确定图片分类
     * @param {string} text - 文本内容
     * @returns {string} - 图片分类
     */
    analyzeTextCategory(text) {
        const textLower = text.toLowerCase();
        
        // 计算每个分类的匹配分数
        const scores = {};
        
        for (const [keyword, category] of Object.entries(this.keywordMapping)) {
            if (textLower.includes(keyword)) {
                scores[category] = (scores[category] || 0) + 1;
            }
        }
        
        // 返回分数最高的分类，默认为nature
        let bestCategory = 'nature';
        let bestScore = 0;
        
        for (const [category, score] of Object.entries(scores)) {
            if (score > bestScore) {
                bestCategory = category;
                bestScore = score;
            }
        }
        
        return bestCategory;
    }
    
    /**
     * 创建彩色SVG插图
     * @param {string} text - 文本内容
     * @param {number} index - 段落索引
     * @returns {string} - SVG数据URL
     */
    createColorfulSVG(text, index = 0) {
        const category = this.analyzeTextCategory(text);
        const config = this.getSVGConfig(category);
        
        const svg = `
            <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="bg-${index}" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:${config.gradient[0]};stop-opacity:1" />
                        <stop offset="100%" style="stop-color:${config.gradient[1]};stop-opacity:1" />
                    </linearGradient>
                    <radialGradient id="light-${index}" cx="30%" cy="30%">
                        <stop offset="0%" style="stop-color:rgba(255,255,255,0.8);stop-opacity:1" />
                        <stop offset="100%" style="stop-color:rgba(255,255,255,0);stop-opacity:0" />
                    </radialGradient>
                </defs>
                
                <!-- 背景 -->
                <rect width="100%" height="100%" fill="url(#bg-${index})"/>
                <ellipse cx="120" cy="80" rx="60" ry="40" fill="url(#light-${index})" opacity="0.6"/>
                
                <!-- 装饰元素 -->
                ${this.generateDecorations(config, index)}
                
                <!-- 主要图标 -->
                <text x="50%" y="45%" text-anchor="middle" fill="white" font-size="48" font-family="Arial">
                    ${config.icon}
                </text>
                
                <!-- 类别标签 -->
                <text x="50%" y="70%" text-anchor="middle" fill="white" font-size="14" font-family="Arial" opacity="0.9">
                    ${config.label}
                </text>
                
                <!-- 段落编号 -->
                <circle cx="350" cy="50" r="20" fill="rgba(255,255,255,0.3)"/>
                <text x="350" y="55" text-anchor="middle" fill="white" font-size="14" font-weight="bold">
                    ${index + 1}
                </text>
            </svg>
        `;
        
        return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
    }
    
    /**
     * 获取SVG配置
     * @param {string} category - 图片分类
     * @returns {Object} - SVG配置对象
     */
    getSVGConfig(category) {
        const configs = {
            animals: {
                gradient: ['#FF6B9D', '#FFB6C1'],
                icon: '🐰',
                label: '可爱动物',
                decorations: ['🌸', '🦋', '💕']
            },
            nature: {
                gradient: ['#4ECDC4', '#44A08D'],
                icon: '🌳',
                label: '美丽自然',
                decorations: ['🌺', '🍃', '✨']
            },
            fantasy: {
                gradient: ['#A8E6CF', '#DDA0DD'],
                icon: '🌟',
                label: '奇幻世界',
                decorations: ['⭐', '🎭', '🎪']
            },
            home: {
                gradient: ['#FFE066', '#FFA07A'],
                icon: '🏠',
                label: '温馨家园',
                decorations: ['💝', '🎁', '🌈']
            },
            adventure: {
                gradient: ['#87CEEB', '#20B2AA'],
                icon: '🗺️',
                label: '冒险旅程',
                decorations: ['⛰️', '🌊', '🦅']
            }
        };
        
        return configs[category] || configs.nature;
    }
    
    /**
     * 生成装饰元素
     * @param {Object} config - SVG配置
     * @param {number} index - 索引
     * @returns {string} - SVG装饰元素
     */
    generateDecorations(config, index) {
        const decorations = config.decorations || ['✨', '🌟', '💫'];
        const positions = [
            { x: 50, y: 80, size: 16 },
            { x: 320, y: 120, size: 14 },
            { x: 80, y: 200, size: 18 }
        ];
        
        return positions.map((pos, i) => {
            const decoration = decorations[i % decorations.length];
            const rotation = (index * 30 + i * 45) % 360;
            return `
                <text x="${pos.x}" y="${pos.y}" text-anchor="middle" fill="rgba(255,255,255,0.8)" 
                      font-size="${pos.size}" font-family="Arial"
                      transform="rotate(${rotation} ${pos.x} ${pos.y})">
                    ${decoration}
                </text>
            `;
        }).join('');
    }
    
    /**
     * 测试图片URL是否可访问
     * @param {string} url - 图片URL
     * @returns {Promise<boolean>} - 是否可访问
     */
    async testImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
            
            // 5秒超时
            setTimeout(() => resolve(false), 5000);
        });
    }
    
    /**
     * 获取备用图片（智能选择最佳方案）
     * @param {string} text - 文本内容
     * @param {number} index - 段落索引
     * @returns {Promise<string>} - 图片URL或SVG
     */
    async getFallbackImage(text, index = 0) {
        // 方案1: 尝试使用在线图片
        const imageUrl = this.getImageForText(text, index);
        const isImageAvailable = await this.testImageUrl(imageUrl);
        
        if (isImageAvailable) {
            console.log(`使用在线图片: ${imageUrl}`);
            return imageUrl;
        }
        
        // 方案2: 使用彩色SVG插图
        console.log(`使用SVG插图，分类: ${this.analyzeTextCategory(text)}`);
        return this.createColorfulSVG(text, index);
    }
}

// 导出给其他模块使用
window.ImageLibrary = ImageLibrary;