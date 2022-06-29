import { isFunction } from '@vue/shared'
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from './effect'

export function computed(getterOrOptions) {
  let isGetter = isFunction(getterOrOptions)
  let getter
  let setter
  const fn = () => console.warn('computed只读的')
  if (isGetter) {
    getter = getterOrOptions
    setter = fn
  } else {
    getter = getterOrOptions.get
    setter = getterOrOptions.set || fn
  }
  return new ComputedRefImpl(getter, setter)
}

class ComputedRefImpl {
  private _value
  private _dirty = true
  public effect
  public deps
  constructor(getter, public setter) {
    // 拿到effect实例让函数执行
    this.effect = new ReactiveEffect(getter, () => {
      // 如果这个值变了
      if (!this._dirty) {
        this._dirty = true
        triggerEffects(this.deps)
      }
    }) //拥有依赖收集的能力
  }
  //.value的时候
  get value() {
    if (activeEffect) {
      // 让计算属性做依赖收集
      // 计算属性 -> effect set = [effect]
      trackEffects(this.deps || (this.deps = new Set()))
    }
    if (this._dirty) {
      //脏的的时候执行
      this._dirty = true
      this._value = this.effect.run()
    }
    return this._value
  }
  set value(newValues) {
    this.setter(newValues)
  }
}
