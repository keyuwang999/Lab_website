/* 
   THE ZHANG GROUP WEBSITE SCRIPTS
   Author: The Zhang Group
   Description: Integrated logic for animations, search, pagination, and galleries.
*/

// =========================================
// 全局变量定义 (Global Variables)
// =========================================

// News Pagination Settings
const newsItemsPerPage = 5;
let newsCurrentPage = 1;
let newsVisibleItems = []; // 存储当前筛选后可见的新闻卡片列表

// =========================================
// 页面加载完成后执行 (DOMContentLoaded)
// =========================================
document.addEventListener('DOMContentLoaded', function () {

    // --- 1. 基础功能初始化 ---

    // Initialize AOS Animation
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-out',
            once: true,
            offset: 100
        });
    }

    // Navbar Scroll Effect (Shadow Toggle)
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                navbar.classList.add('shadow-sm');
            } else {
                navbar.classList.remove('shadow-sm');
            }
        });
    }

    // Preloader Logic
    const preloader = document.getElementById('preloader');
    if (preloader) {
        // 当页面资源加载完毕后消失
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('fade-out');
            }, 300);
        });
        // 兜底机制：如果3秒还没加载完，强制消失，避免一直转圈
        setTimeout(() => {
            preloader.classList.add('fade-out');
        }, 3000);
    }

    // Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('show');
            } else {
                backToTopBtn.classList.remove('show');
            }
        });
        backToTopBtn.addEventListener('click', function (e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // =========================================
    // 强制修复：防遮挡平滑滚动 (粘贴到 script.js 中)
    // =========================================

    // 1. 通用滚动函数 (自动计算高度，绝对不会被挡住)
    function scrollToWithOffset(selector) {
        const element = document.querySelector(selector);
        if (!element) return;

        // 计算遮挡高度：
        // 电脑端 = 120px (导航栏 + 间隙)
        // 手机端 = 220px (导航栏 + 吸顶搜索框 + 间隙)
        const headerOffset = window.innerWidth < 992 ? 220 : 120;
        
        // 计算目标绝对坐标
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        // 执行滚动
        window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
        });
    }

    // 2. 监听所有“Jump To”侧边栏链接 (以及回到顶部以外的锚点)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            
            // 忽略空链接、回到顶部按钮、News分页按钮
            if (targetId === '#' || this.id === 'back-to-top' || this.classList.contains('page-link')) return;
            
            e.preventDefault(); // 阻止浏览器默认跳转
            scrollToWithOffset(targetId); // 让我们自己算的 JS 负责跳转
        });
    });

    // 3. 监听手机端的下拉菜单
    const mobileSelect = document.getElementById('mobileYearSelect');
    if (mobileSelect) {
        mobileSelect.addEventListener('change', function() {
            scrollToWithOffset(this.value);
        });
    }

    // --- 2. 首页 (Home) 功能 ---

    // Particle Animation for Hero Section
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'hero-particles';
        heroSection.appendChild(particleContainer);
        // 生成25个随机浮动粒子
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            // 随机大小
            const size = Math.random() * 15 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            // 随机位置
            particle.style.left = `${Math.random() * 100}%`;
            // 随机动画时长
            const duration = Math.random() * 15 + 5;
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${Math.random() * 5}s`;
            particleContainer.appendChild(particle);
        }
    }

    // --- 3. 论文页 (Publications) 功能 ---

    // Real-time Paper Search
    const paperSearch = document.getElementById('paperSearch');
    if (paperSearch) {
        const noResultsMsg = document.getElementById('noResultsMsg');
        paperSearch.addEventListener('keyup', function () {
            const filter = paperSearch.value.toLowerCase();
            const papers = document.querySelectorAll('.pub-list li');
            let visibleCount = 0;

            papers.forEach(paper => {
                const text = paper.innerText.toLowerCase();
                if (text.includes(filter)) {
                    paper.style.display = "";
                    visibleCount++;
                } else {
                    paper.style.display = "none";
                }
            });
            // 提示搜不到内容
            if (noResultsMsg) {
                noResultsMsg.style.display = visibleCount === 0 ? "block" : "none";
            }
        });
    }

    // Mobile Search Bar Sticky Logic (Force Sticky via JS)
    const searchContainer = document.getElementById('searchContainer');
    const searchPlaceholder = document.getElementById('searchPlaceholder');

    if (searchContainer && searchPlaceholder) {
        window.addEventListener('scroll', function () {
            // 只在移动端生效 (< 992px)
            if (window.innerWidth < 992) {
                const rect = searchPlaceholder.getBoundingClientRect();
                // 76px 是导航栏的大致高度
                if (rect.top <= 76) {
                    searchContainer.classList.add('search-is-fixed');
                    searchPlaceholder.classList.add('show');
                } else {
                    searchContainer.classList.remove('search-is-fixed');
                    searchPlaceholder.classList.remove('show');
                }
            } else {
                // 桌面端重置
                searchContainer.classList.remove('search-is-fixed');
                searchPlaceholder.classList.remove('show');
            }
        });
    }

    // --- 9. 全局图片防崩机制 (Image Fallback) ---
    // 这是一道“保险”。如果您以后换图片手抖写错了路径，
    // 它会自动换成一张默认图，或者东南大学Logo，防止出现丑陋的“裂图”图标。
    document.querySelectorAll('img').forEach(img => {
        img.addEventListener('error', function () {
            // 方法A: 替换为默认图 (推荐找一张通用的实验室Logo存下来)
            // this.src = 'https://dummyimage.com/600x400/e9ecef/6c757d&text=Image+Not+Found';

            // 方法B: (更优雅) 既然图挂了，不如用CSS给它一个漂亮的灰色背景
            this.style.display = 'none'; // 隐藏破图
            const placeholder = document.createElement('div');
            placeholder.className = 'img-error-placeholder d-flex align-items-center justify-content-center bg-light text-muted small';
            placeholder.style.width = '100%';
            placeholder.style.height = '100%';
            placeholder.style.minHeight = '200px'; // 保证占位
            placeholder.innerHTML = '<i class="fas fa-image fa-2x opacity-25"></i>';

            // 把占位块插到破图的位置
            if (this.parentNode) {
                this.parentNode.appendChild(placeholder);
            }
        });
    });

    // --- 4. 新闻页 (News) 功能 ---

    // Auto Pagination & Filtering Initialization
    // 检测是否在新闻页面
    if (document.getElementById('news-feed')) {
        const newsSearchInput = document.getElementById('newsSearchInput');
        const categoryLinks = document.querySelectorAll('.category-filter');
        // 获取所有新闻条目，作为初始全集
        const allNewsItems = Array.from(document.querySelectorAll('.news-item'));

        // 首次加载，显示所有，初始化分页
        updatePagination(allNewsItems);

        // 绑定左侧搜索框事件
        if (newsSearchInput) {
            newsSearchInput.addEventListener('keyup', function () {
                const term = this.value.toLowerCase();
                // 重置所有分类按钮的高亮状态
                categoryLinks.forEach(l => l.classList.remove('text-seu-green', 'fw-bold'));
                // 执行综合过滤
                runNewsFilter(term, 'all', allNewsItems);
            });
        }

        // 绑定右侧分类链接事件
        if (categoryLinks) {
            categoryLinks.forEach(link => {
                link.addEventListener('click', function (e) {
                    e.preventDefault();
                    // 样式高亮切换
                    categoryLinks.forEach(l => l.classList.remove('text-seu-green', 'fw-bold'));
                    this.classList.add('text-seu-green', 'fw-bold');

                    const category = this.getAttribute('data-filter');
                    // 清空搜索框内容，确保逻辑清晰
                    if (newsSearchInput) newsSearchInput.value = '';

                    // 执行综合过滤
                    runNewsFilter('', category, allNewsItems);
                });
            });
        }
    }

    // --- 5. Gallery 页 (Gallery) 功能 ---

    // GLightbox Initialization
    if (typeof GLightbox !== 'undefined') {
        const lightbox = GLightbox({
            touchNavigation: true,
            loop: true,
            autoplayVideos: true,
            selector: '.glightbox' // 绑定特定 class
        });
    }

    // Animated Gallery Filtering
    const filterButtons = document.querySelectorAll('.filter-btn');
    const galleryItems = document.querySelectorAll('.gallery-item');

    if (filterButtons.length > 0) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // 按钮样式
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const filterValue = btn.getAttribute('data-filter');

                galleryItems.forEach(item => {
                    // 第一步：缩小淡出
                    item.style.transition = 'all 0.3s ease';
                    item.style.opacity = '0';
                    item.style.transform = 'scale(0.8)';

                    setTimeout(() => {
                        // 判断是否匹配
                        if (filterValue === 'all' || item.classList.contains(filterValue)) {
                            item.style.display = 'block';
                            // 第二步：淡入放大 (略微延迟以实现动画效果)
                            setTimeout(() => {
                                item.style.opacity = '1';
                                item.style.transform = 'scale(1)';
                            }, 50);
                        } else {
                            item.style.display = 'none';
                        }
                    }, 300); // 300ms 后切换 display 属性
                });
            });
        });
    }

});

// =========================================
// 全局辅助函数 (Global Helper Functions)
// 这些函数必须在 global scope，因为 HTML inline onclick 只能调用 global
// =========================================

/**
 * 复制论文引用 (Publications Page)
 */
function copyCitation(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert("Citation copied to clipboard! (引用已复制)");
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert("Copy failed. Please manually copy the citation.");
    });
}

/**
 * 打开新闻详情弹窗 (News Page)
 * 参数包括触发元素、标题、日期、分类、正文内容、图片地址
 */
function openNewsModal(element, title, date, category, content, imgSrc) {
    // 阻止链接默认行为
    // event 关键字依赖于 window.event
    if (window.event) window.event.preventDefault();

    // 填充 Modal 内部的数据
    const modalTitle = document.getElementById('modalTitle');
    const modalDate = document.getElementById('modalDate');
    const modalCategory = document.getElementById('modalCategory');
    const modalContent = document.getElementById('modalContent');
    const modalImage = document.getElementById('modalImage');

    if (modalTitle) modalTitle.innerText = title;
    if (modalDate) modalDate.innerText = date;
    if (modalCategory) modalCategory.innerText = category;

    // 内容支持 HTML 标签（如换行符）
    if (modalContent) modalContent.innerHTML = content; // 使用 innerHTML 允许分段

    if (modalImage) modalImage.src = imgSrc;

    // 使用 Bootstrap API 显示 Modal
    const myModalEl = document.getElementById('newsDetailModal');
    if (myModalEl) {
        const myModal = new bootstrap.Modal(myModalEl);
        myModal.show();
    }
}

/**
 * 新闻筛选逻辑核心
 * 搜索 + 分类 双重判断
 */
function runNewsFilter(searchTerm, category, allItems) {
    const filteredItems = [];

    allItems.forEach(item => {
        const text = item.innerText.toLowerCase(); // 获取卡片内的所有文本
        const itemCats = item.getAttribute('data-category'); // 获取 data-category 属性

        const matchesSearch = text.includes(searchTerm);
        const matchesCategory = category === 'all' || (itemCats && itemCats.includes(category));

        if (matchesSearch && matchesCategory) {
            filteredItems.push(item);
        } else {
            // 如果不匹配，暂时先隐藏，等 pagination 接管
            item.style.display = 'none';
        }
    });

    // 搜索结果提示
    const noNewsMsg = document.getElementById('noNewsMsg');
    if (noNewsMsg) {
        noNewsMsg.style.display = filteredItems.length === 0 ? 'block' : 'none';
    }

    // 重置分页到第一页
    newsCurrentPage = 1;

    // 触发分页渲染
    updatePagination(filteredItems);
}

/**
 * 新闻分页: 更新按钮与列表 (News Page)
 */
function updatePagination(items) {
    // 保存当前过滤后的项目到全局变量
    newsVisibleItems = items;

    const totalPages = Math.ceil(items.length / newsItemsPerPage);
    const paginationContainer = document.getElementById('pagination-container');

    // 安全检查
    if (!paginationContainer) return;

    // 如果页数少于等于1，隐藏分页条，显示所有 items
    if (totalPages <= 1) {
        paginationContainer.style.display = 'none';
        // 显示 items (如果没有分页，就全部展示出来)
        renderPageItems();
        return;
    }

    // 如果需要分页，显示分页条
    paginationContainer.style.display = 'flex';
    let paginationHTML = '';

    // Prev Button
    paginationHTML += `
        <li class="page-item ${newsCurrentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${newsCurrentPage - 1}); return false;">Previous</a>
        </li>`;

    // Page Numbers
    for (let i = 1; i <= totalPages; i++) {
        paginationHTML += `
            <li class="page-item ${newsCurrentPage === i ? 'active' : ''}">
                <a class="page-link ${newsCurrentPage === i ? 'bg-seu-green border-seu-green' : 'text-dark'}" 
                   href="#" onclick="changePage(${i}); return false;">${i}</a>
            </li>`;
    }

    // Next Button
    paginationHTML += `
        <li class="page-item ${newsCurrentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link text-dark" href="#" onclick="changePage(${newsCurrentPage + 1}); return false;">Next</a>
        </li>`;

    paginationContainer.innerHTML = paginationHTML;

    // 最后渲染实际的新闻卡片
    renderPageItems();
}

/**
 * 新闻分页: 切换页面事件
 */
function changePage(page) {
    const totalPages = Math.ceil(newsVisibleItems.length / newsItemsPerPage);

    // 边界检查
    if (page < 1 || page > totalPages) return;

    newsCurrentPage = page;

    // 更新按钮状态
    updatePagination(newsVisibleItems);

    // 滚动回到新闻列表顶部 (增强体验)
    const newsFeed = document.getElementById('news-feed');
    if (newsFeed) newsFeed.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * 新闻分页: 渲染当前页的内容
 */
function renderPageItems() {
    // 1. 先把所有可能的新闻都隐藏
    // 注意：这里需要操作的是原始的所有新闻 DOM 集合，还是只是可见集合？
    // 为了保险，先全部隐藏，再显示 slice 出来的部分
    // 但是效率最高的方式是只操作 currentVisibleItems

    const allDomItems = document.querySelectorAll('.news-item');
    allDomItems.forEach(el => el.style.display = 'none');

    // 2. 计算切片索引
    const start = (newsCurrentPage - 1) * newsItemsPerPage;
    const end = start + newsItemsPerPage;

    // 3. 截取当前页需要显示的数据
    const itemsToShow = newsVisibleItems.slice(start, end);

    // 4. 显示
    itemsToShow.forEach(item => {
        item.style.display = 'block';
        // 重新触发 AOS 滚动动画 (小技巧：先移除再添加类名)
        item.classList.remove('aos-animate');
        setTimeout(() => item.classList.add('aos-animate'), 50);
    });
}

// --- 10. 移动端导航自动收起优化 ---
    // 专门解决：手机上点击了链接跳转，菜单栏却还挡在脸上的问题
    const navbarToggler = document.querySelector('.navbar-toggler');
    const navbarCollapse = document.querySelector('.navbar-collapse');
    
    document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
        link.addEventListener('click', () => {
            // 如果菜单是打开状态，且确实是在手机模式下
            if (navbarCollapse.classList.contains('show') && window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click(); // 模拟点击一下汉堡按钮来关闭
            }
        });
    });