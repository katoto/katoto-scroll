import vueMyClass from './components/myClass.vue'

vueMyClass.install = function(Vue, options = {}){
    Vue.component(options.componentName || vueMyClass.name, vueMyClass)
}
console.log(vueMyClass)
if(typeof window !== 'undefined' && window.Vue){
    Vue.component(vueMyClass.name, vueMyClass)
}

export default vueMyClass