module.exports = {
    port: "8080",
    // dest: ".site",
    base: "/",
    // 是否开启默认预加载js
    shouldPrefetch: (file, type) => {
        return false;
    },
    // webpack 配置 https://vuepress.vuejs.org/zh/config/#chainwebpack
    chainWebpack: config => {
        if (process.env.NODE_ENV === 'production') {
            const dateTime = new Date().getTime();

            // 清除js版本号
            config.output.filename('assets/js/cg-[name].js?v=' + dateTime).end();
            config.output.chunkFilename('assets/js/cg-[name].js?v=' + dateTime).end();

            // 清除css版本号
            config.plugin('mini-css-extract-plugin').use(require('mini-css-extract-plugin'), [{
                filename: 'assets/css/[name].css?v=' + dateTime,
                chunkFilename: 'assets/css/[name].css?v=' + dateTime
            }]).end();

        }
    },
    markdown: {
        lineNumbers: true,
        externalLinks: {
            target: '_blank', rel: 'noopener noreferrer'
        }
    },
    locales: {
        "/": {
            lang: "zh-CN",
            title: "小让の糖果屋",
            description: "包含: Java 基础, Java设计模式, 数据结构与算法, 源码分析..."
        }
    },
    head: [
        // ico
        ["link", {rel: "icon", href: `/favicon.ico`}],
        // meta
        ["meta", {name: "robots", content: "all"}],
        ["meta", {name: "author", content: "小让"}],
        ["meta", {"http-equiv": "Cache-Control", content: "no-cache, no-store, must-revalidate"}],
        ["meta", {"http-equiv": "Pragma", content: "no-cache"}],
        ["meta", {"http-equiv": "Expires", content: "0"}],
        ["meta", {
            name: "keywords",
            content: "小让の糖果屋, 数据结构与算法, 设计模式, 源码分析, Java基础, 八股文"
        }],
        ["meta", {name: "apple-mobile-web-app-capable", content: "yes"}],
        ['script',
            {
                charset: 'utf-8',
                async: 'async',
                // src: 'https://code.jquery.com/jquery-3.5.1.min.js',
                src: '/js/jquery.min.js',
            }],
        ['script',
            {
                charset: 'utf-8',
                async: 'async',
                // src: 'https://code.jquery.com/jquery-3.5.1.min.js',
                src: '/js/global.js',
            }],
        ['script',
            {
                charset: 'utf-8',
                async: 'async',
                src: '/js/fingerprint2.min.js',
            }],
        // ['script',
        //     {
        //         charset: 'utf-8',
        //         async: 'async',
        //         src: 'https://s9.cnzz.com/z_stat.php?id=1278232949&web_id=1278232949',
        //     }],
        // 添加百度统计
        ["script", {},
            `
              var _hmt = _hmt || [];
              (function() {
                var hm = document.createElement("script");
                hm.src = "https://hm.baidu.com/hm.js?0b31b4c146bf7126aed5009e1a4a11c8";
                var s = document.getElementsByTagName("script")[0];
                s.parentNode.insertBefore(hm, s);
              })();
            `
        ]
    ],
    plugins: [
        [
            {globalUIComponents: []}
        ],
        ['@vuepress/search', {
            searchMaxSuggestions: 10
        }],
        // ['@vssue/vuepress-plugin-vssue', {
        //     platform: 'github-v3', //v3的platform是github，v4的是github-v4
        //     // 其他的 Vssue 配置
        //     owner: 'fuzhengwei', //github账户名
        //     repo: 'CodeGuide', //github一个项目的名称
        //     clientId: 'df8beab2190bec20352a',//注册的Client ID
        //     clientSecret: '7eeeb4369d699c933f02a026ae8bb1e2a9c80e90',//注册的Client Secret
        //     autoCreateIssue: true // 自动创建评论，默认是false，最好开启，这样首次进入页面的时候就不用去点击创建评论的按钮了。
        // }
        // ],
        // ['@vuepress/back-to-top', true], replaced with inject page-sidebar
        ['@vuepress/medium-zoom', {
            selector: 'img:not(.nozoom)',
            // See: https://github.com/francoischalifour/medium-zoom#options
            options: {
                margin: 16
            }
        }],
        // https://v1.vuepress.vuejs.org/zh/plugin/official/plugin-pwa.html#%E9%80%89%E9%A1%B9
        // ['@vuepress/pwa', {
        //     serviceWorker: true,
        //     updatePopup: {
        //         '/': {
        //             message: "发现新内容可用",
        //             buttonText: "刷新"
        //         },
        //     }
        // }],
        // see: https://vuepress.github.io/zh/plugins/copyright/#%E5%AE%89%E8%A3%85
        // ['copyright', {
        //     noCopy: false, // 允许复制内容
        //     minLength: 100, // 如果长度超过 100 个字符
        //     authorName: "https://xiaorang.fun",
        //     clipboardComponent: "请注明文章出处, [小让の糖果屋](https://xiaorang.fun)"
        // }],
        // see: https://github.com/ekoeryanto/vuepress-plugin-sitemap
        // ['sitemap', {
        //     hostname: 'https://xiaorang.fun'
        // }],
        // see: https://github.com/IOriens/vuepress-plugin-baidu-autopush
        ['vuepress-plugin-baidu-autopush', {}],
        // see: https://github.com/znicholasbrown/vuepress-plugin-code-copy
        ['vuepress-plugin-code-copy', {
            align: 'bottom',
            color: '#3eaf7c',
            successText: '代码已经复制到剪贴板'
        }],
        // see: https://github.com/tolking/vuepress-plugin-img-lazy
        ['img-lazy', {}],
        ["vuepress-plugin-tags", {
            type: 'default', // 标签预定义样式
            color: '#42b983',  // 标签字体颜色
            border: '1px solid #e2faef', // 标签边框颜色
            backgroundColor: '#f0faf5', // 标签背景颜色
            selector: '.page .content__default h1' // ^v1.0.1 你要将此标签渲染挂载到哪个元素后面？默认是第一个 H1 标签后面；
        }],
        // https://github.com/lorisleiva/vuepress-plugin-seo
        ["seo", {
            siteTitle: (_, $site) => $site.title,
            title: $page => $page.title,
            description: $page => $page.frontmatter.description,
            author: (_, $site) => $site.themeConfig.author,
            tags: $page => $page.frontmatter.tags,
            // twitterCard: _ => 'summary_large_image',
            type: $page => 'article',
            url: (_, $site, path) => ($site.themeConfig.domain || '') + path,
            image: ($page, $site) => $page.frontmatter.image && (($site.themeConfig.domain && !$page.frontmatter.image.startsWith('http') || '') + $page.frontmatter.image),
            publishedAt: $page => $page.frontmatter.date && new Date($page.frontmatter.date),
            modifiedAt: $page => $page.lastUpdated && new Date($page.lastUpdated),
        }]
    ],
    themeConfig: {
        docsRepo: "xihuanxiaorang/CodeGuide",
        // 编辑文档的所在目录
        docsDir: 'docs',
        // 文档放在一个特定的分支下：
        docsBranch: 'main',
        //logo: "/logo.png",
        editLinks: true,
        sidebarDepth: 0,
        lastUpdated: 'Last Updated',
        displayAllHeaders: false,
        //smoothScroll: true,
        locales: {
            "/": {
                label: "简体中文",
                selectText: "Languages",
                editLinkText: "在 GitHub 上编辑此页",
                lastUpdated: "上次更新",
                nav: [
                    // {
                    //     text: '导读', link: '/md/other/guide-to-reading.md'
                    // },
                    {
                        text: 'Java',
                        items: [                          
                            {
                                text: '基础技术',
                                link: '/md/java/core/'
                            }
                        ]
                    },
                    {
                        text: '深入设计模式',
                        link: '/md/设计模式/'
                    },
                    {
                        text: '算法',
                        items: [
                            {
                                text: '数据结构',
                                link: '/md/数据结构与算法/数据结构/'
                            },
                            {
                                text: '算法主题',
                                link: '/md/数据结构与算法/算法/排序算法/冒泡排序.md'
                            },
                            {
                                text: 'LeetCode',
                                link: '/md/LeetCode/206.反转链表.md'
                            }
                        ]
                    },
                    {
                        text: 'Spring全家桶',
                        link: '/md/spring全家桶/spring/IOC.md'
                    },
                    {
                        text: '面试宝典',
                        link: '/md/面试宝典/basic/Java基础面试题（上）.md'
                    },
                    {
                        text: '源码分析',
                        link: '/md/源码分析/spring/'
                    },
                ],
                sidebar: {
                    "/md/java/core/": genBarJavaCore(),
                    "/md/设计模式/": genBarDesignPattern(),
                    "/md/数据结构与算法/数据结构/": genAlgorithmDataStructures(),
                    "/md/数据结构与算法/算法/": genAlgorithmLogic(),
                    "/md/LeetCode/": genBarLeetCode(),
                    "/md/spring全家桶/": genBarSpring(),
                    "/md/面试宝典/": genBarJavaInterview(),
                    "/md/源码分析/": genBarSourceCode(),
                }
            }
        }
    }
};

// java-core
function genBarJavaCore() {
    return [
        {
            title: "基础技术",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                
            ]
        }
    ]
}

// 设计模式
function genBarDesignPattern() {
    return [
        {
            title: "介绍",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "",
                "七大设计原则.md",
            ]
        },
        {
            title: "创建型模式",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "工厂方法模式.md",
                "抽象工厂模式.md",
                "建造者模式.md",
                "单例模式.md",
            ]
        },
        {
            title: "结构型模式",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "适配器模式.md",
                "享元模式.md",
                "代理模式.md",
            ]
        },
        {
            title: "行为型模式",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "责任链模式.md",
                "观察者模式.md",
                "状态模式.md",
                "策略模式.md",
                "模板方法模式.md",
            ]
        }
    ]
}

// 数据结构
function genAlgorithmDataStructures() {
    return [
        {
            title: "介绍",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "",
            ]
        },
        {
            title: "线性表",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "线性表/数组.md",
                "线性表/链表.md",
                "线性表/栈.md",
                "线性表/队列.md",
                "线性表/双端队列.md",
            ]
        },
        {
            title: "树",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "树/二叉树.md",
                "树/红黑树.md",
            ]
        },
    ]
}

// 算法
function genAlgorithmLogic() {
    return [
        {
            title: "排序算法",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "排序算法/冒泡排序.md",
                "排序算法/鸡尾酒排序.md",
                "排序算法/快速排序.md",
            ]
        },
        {
            title: "其他",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "其他/逆波兰表达式.md",
            ]
        }
    ]
}

// LeetCode
function genBarLeetCode() {
    return [
        {
            title: "链表",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "206.反转链表.md",
                "237.删除链表中的节点.md",
            ]
        },
        {
            title: "栈",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "20.有效的括号.md",
                "36.后缀表达式.md",
                "剑指 Offer 09. 用两个栈实现队列.md",
            ]
        },
        {
            title: "队列",
            collapsable: false,
            sidebarDepth: 0,
            children: [

            ]
        },
    ]
}

// spring全家桶
function genBarSpring() {
    return [
        {
            title: "Spring",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "spring/IOC.md",
                "spring/AOP.md",
                "spring/JDBC.md",
                "spring/事务.md",
                "spring/Spring注解驱动开发.md",
            ]
        },
        {
            title: "SpringMVC",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "springmvc/",
            ]
        },
    ]
}

// java-interview
function genBarJavaInterview() {
    return [
        {
            title: "Java 基础",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "basic/Java基础面试题（上）.md",
                "basic/Java基础面试题（下）.md",
            ]
        },
        {
            title: "数据结构和算法",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "HashMap.md",
            ]
        },
        {
            title: "MySQL",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "MySQL.md",
            ]
        },
        {
            title: "Spring",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "Spring.md",
            ]
        }
    ]
}

// 面试宝典
function genBarSourceCode() {
    return [
        {
            title: "Spring",
            collapsable: false,
            sidebarDepth: 0,
            children: [
                "spring/",
                "spring/Spring源码环境搭建.md",
                "spring/Spring注册Bean的几种方式.md",
                "spring/Spring-BeanDefinition加载流程分析.md",
                "spring/Spring-ConfigurationClassPostProcessor后置处理器详解.md",
                "spring/Spring事件订阅与发布原理分析.md"
            ]
        },
    ]
}