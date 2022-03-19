// 防抖装饰器
export class debounce{
    static use(fn:Function,ms:number=1000){
        let timer: NodeJS.Timeout|null;
        return (...args:any)=>{
            if(!timer){
                fn.apply(this,args)
                timer = setTimeout(() => {
                    timer&&clearTimeout(timer)
                    timer= null
                }, ms);
            }
        }
    }
}