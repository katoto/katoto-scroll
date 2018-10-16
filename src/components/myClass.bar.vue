<template>
    <div ref="wrap">
        <div :style="leftSwitch" >
            <slot name="left-switch"></slot>
        </div>
        <div >
            <slot name="right-switch"></slot>
        </div>
        <div ref="realBox">
            <div ref="slotList">
                <slot></slot>
            </div>
            <div v-html="copyHtml" :style="float"></div>
        </div>
    </div>    
</template>
<script>
    
    export default {
        name:'katoto-scroll',
        data (){
            return {
                xPos: 0,
                yPos: 0,
                delay: 0,
                copyHtml:'',
                height: 0,
                width: 0, // 外容器宽度
                realBoxWidth: 0, // 内容实际宽度 
                reqFrame: null,  // move动画的animationFrame定时器
                singleWaitTime: null,  // single 单步滚动的定时器
                isHover:false  // mouseenter mouseleave 控制this._move()的开关
            }
        },
        props:{
            // 子父组件通信
            data:{
                type:Array,
                default:()=>{
                    return []
                }
            },
            classOption:{
                // 配置选项
                type:Object,
                default:()=>{
                    return {}
                }
            }
        },
        computed:{
            defaultOption (){
                return {
                    step: 1, // 歩长
                    limitMoveNum: 5, // 启动无缝滚动最小数据数
                    hoverStop: true, // 是否启用鼠标hover 控制
                    direction: 1, // 0 往下 1 往上 2向左 3向右
                    openTouch: true, //开启移动端touch
                    singleHeight: 0, //单条数据高度有值hoverStop关闭
                    singleWidth: 0, //单条数据宽度有值hoverStop关闭
                    waitTime: 1000, //单步停止等待时间
                    switchOffset: 30,
                    autoPlay: true,
                    switchSingleStep: 134,
                    switchDelay: 400,
                    switchDisabledClass: 'disabled',
                    isSingleRemUnit: false // singleWidth/singleHeight 是否开启rem度量
                }
            },
            isHorizontal(){
                // ???
                // return this.options.direction > 1 || !this.options.autoPlay
                return this.options.direction > 1 || !this.options.autoPlay
            },
            options(){
                return copyObj({},this.defaultOption,this.classOption)
            },
            moveSwitch () {
                return this.data.length < this.options.limitMoveNum
            },
            hoverStop () {
                return !this.options.autoPlay || !this.options.hoverStop || this.moveSwitch
            },
            canNotTouch () {
                return !this.options.openTouch || !this.options.autoPlay
            },
            isHorizontal () {
                return this.options.direction > 1 || !this.options.autoPlay
            },
            baseFontSize () {
                return this.options.isSingleRemUnit ? parseInt(window.getComputedStyle(document.documentElement, null).fontSize) : 1
            },
            realSingleStopWidth () {
                return this.options.singleWidth * this.baseFontSize
            },
            realSingleStopHeight () {
                return this.options.singleHeight * this.baseFontSize
            }
        },
        methods:{
            // utils func
            initFn(){
                window.cancelAnimationFrame = function(){
                    return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.oCancelAnimationFrame || window.msCancelAnimationFrame
                    || function(id){ return window.clearTimeout(id) }
                }();
                window.requestAnimationFrame = function(){
                    return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
                        return window.setTimeout(callback, 1000 / 60);
                    };
                }();
            },
            arrayEqual(arr1, arr2 ){
                if(arr1 === arr2) return true;
                if(arr1.length !== arr2.length) return false;
                for(var i=0; i< arr1.length;++i){
                    if(arr1[i] !== arr2[i]) return false
                }
                return true
            },
            copyObj(){
                // 深浅合并拷贝
                if( !Array.isArray ){
                    Array.isArray = function(arg){
                        return Object.prototype.toString.call(arg) === '[object Array]' ;
                    };
                }
                var name = void 0,
                    options = void 0,
                    src = void 0,
                    copy = void 0,
                    copyIsArray = void 0,
                    clone = void 0,
                    i = 1,
                    target = arguments[0] || {},
                    deep = false,
                    len = arguments.length;
                if (typeof target === 'boolean') {
                    deep = target;
                    target = arguments[1] || {};
                    i++;
                }
                if ((typeof target === 'undefined' ? 'undefined' : _typeof(target)) !== 'object' && typeof target !== 'function') {
                    target = {};
                }
                // 如果arguments.length === 1 或typeof arguments[0] === 'boolean',且存在arguments[1]，则直接返回target对象
                if (i === len) {
                    return target;
                }
                for (; i < len; i++) {
                    if ((options = arguments[i]) != null) {
                        for (name in options) {
                            src = target[name];
                            copy = options[name];
                            copyIsArray = Array.isArray(copy);
                            if (deep && copy && ((typeof copy === 'undefined' ? 'undefined' : _typeof(copy)) === 'object' || copyIsArray)) {
                                if (copyIsArray) {
                                    copyIsArray = false;
                                    clone = src && Array.isArray(src) ? src : [];
                                } else {
                                    clone = src && (typeof src === 'undefined' ? 'undefined' : _typeof(src)) === 'object' ? src : {};
                                }
                                target[name] = copyObj(deep, clone, copy);
                            } else if (copy !== undefined) {
                                target[name] = copy;
                            }
                        }
                    }
                }
                return target;
            },
            _cancle(){
                // 清除定时器
                cancelAnimationFrame( this.reqFrame || '')
            },
            _move(){
                // 鼠标移入停止
                if(this.isHover) return
                this._cancle() // 进入move立即先清除动画 防止频繁touchMove导致多动画同时进行
                this.reqFrame = requestAnimationFrame(
                    function () {
                        if (!this.$refs.realBox) return //fixed 路由之间切换报this.$refs.realBox.offsetHeigh undefined bug
                        const h = this.$refs.realBox.offsetHeight / 2  //实际高度
                        const w = this.$refs.slotList.offsetWidth //宽度
                        const direction = this.options.direction //滚动方向
                        if (direction === 1) { // 上
                        if (Math.abs(this.yPos) >= h) {
                            this.$emit('ScrollEnd')
                            this.yPos = 0
                        }
                        this.yPos -= this.options.step
                        } else if (direction === 0) { // 下
                            if (this.yPos >= 0) {
                                this.$emit('ScrollEnd')
                                this.yPos = h * -1
                            }
                            this.yPos += this.options.step
                        } else if (direction === 2) { // 左
                            if (Math.abs(this.xPos) >= w) {
                                this.$emit('ScrollEnd')
                                this.xPos = 0
                            }
                            this.xPos -= this.options.step
                        } else if (direction === 3) { // 右
                            if (this.xPos >= 0) {
                                this.$emit('ScrollEnd')
                                this.xPos = w * -1
                            }
                            this.xPos += this.options.step
                        }
                        if (this.singleWaitTime) clearTimeout(this.singleWaitTime)
                        if (!!this.realSingleStopHeight) { //是否启动了单行暂停配置
                            if (Math.abs(this.yPos) % this.realSingleStopHeight < 1) { // 符合条件暂停waitTime
                                this.singleWaitTime = setTimeout(() => {
                                this._move()
                                }, this.options.waitTime)
                            } else {
                                this._move()
                            }
                        } else if (!!this.realSingleStopWidth) {
                            if (Math.abs(this.xPos) % this.realSingleStopWidth < 1) { // 符合条件暂停waitTime
                                this.singleWaitTime = setTimeout(() => {
                                this._move()
                                }, this.options.waitTime)
                            } else {
                                this._move()
                            }
                        } else {
                            this._move()
                        }
                    }.bind(this)                    
                )
            },
            _initMove(){
                this.$nextTick(()=>{
                    this.height = this.$refs.wrap.offsetHeight
                    this.width = this.$refs.wrap.offsetWidth
                    // 水平滚动设置 warp width
                    if(this.isHorizontal){
                        let rate 
                        this.options.autoPlay ? rate =2: rate =1 ;
                        const w = this.$refs.slotList.offsetWidth * rate
                        this.$refs.realBox.style.width = w + 'px';
                        this.realBoxWidth = w
                    }
                    if(!this.options.autoPlay){
                        this.ease = 'linear'
                        this.delay = this.options.switchDelay
                        return
                    }
                    this._dataWarm(this.data)
                    this.copyHtml = '' // 清空copy ?
                    //  是否可以滚动 判断
                    if( this.moveSwitch ){
                        this._cancle()
                        this.yPos = this.xPos = 0
                    }else{
                        // ?
                        this.copyHtml = this.$refs.slotList.innerHTML
                        this._move()
                    }
                })
            },
            _dataWarm(data){
                if(data.length > 1000){
                    console.warn('数据长度太长~')
                }
            }
        },
        mounted(){
            this.initFn()
            //  initMove
            this._initMove()
        },
        watch:{

        },
        beforeDestroy(){
            this._cancle()
        }
    }
</script>