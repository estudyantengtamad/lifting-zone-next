import { create } from 'zustand'
import { products as initialProducts, Product } from './data'
import { sound } from './audio'

type StoreState = {
  products: Product[]
  cart: Record<number, number>
  wish: number[]
  open: boolean
  wishOpen: boolean
  adminOpen: boolean
  toast: string
  soundEnabled: boolean
  quickViewProduct: Product | null
  checkoutOpen: boolean
  coupon: { code: string; percent: number } | null

  // CRUD Actions
  setProducts: (products: Product[]) => void
  addProduct: (product: Product) => void
  updateProduct: (product: Product) => void
  deleteProduct: (id: number) => void
  setAdminOpen: (adminOpen: boolean) => void

  // Cart & UI Actions
  add: (id: number, qty?: number) => void
  addMultiple: (ids: number[]) => void
  qty: (id: number, delta: number) => void
  wishT: (id: number) => void
  setOpen: (open: boolean) => void
  setWishOpen: (wishOpen: boolean) => void
  setQuickViewProduct: (product: Product | null) => void
  setCheckoutOpen: (open: boolean) => void
  toggleSound: () => void
  applyCoupon: (code: string, percent: number) => void
  removeCoupon: () => void
  clearCart: () => void
  showToast: (msg: string) => void
}

export const useStore = create<StoreState>((set, get) => ({
  products: initialProducts,
  cart: {},
  wish: [0, 4],
  open: false,
  wishOpen: false,
  adminOpen: false,
  toast: '',
  soundEnabled: true,
  quickViewProduct: null,
  checkoutOpen: false,
  coupon: null,

  // CRUD Implementations
  setProducts: (products) => set({ products }),

  addProduct: (product) => {
    if (get().soundEnabled) sound.playSuccess()
    set(state => ({
      products: [product, ...state.products],
      toast: `Added "${product.t}" to Supplements inventory!`
    }))
  },

  updateProduct: (product) => {
    if (get().soundEnabled) sound.playClick()
    set(state => ({
      products: state.products.map(p => (p.id === product.id ? product : p)),
      quickViewProduct: state.quickViewProduct?.id === product.id ? product : state.quickViewProduct,
      toast: `Updated "${product.t}" successfully`
    }))
  },

  deleteProduct: (id) => {
    if (get().soundEnabled) sound.playClick()
    set(state => {
      const nextCart = { ...state.cart }
      delete nextCart[id]
      const target = state.products.find(p => p.id === id)
      return {
        products: state.products.filter(p => p.id !== id),
        cart: nextCart,
        quickViewProduct: state.quickViewProduct?.id === id ? null : state.quickViewProduct,
        toast: `Deleted "${target?.t || 'Item'}" from inventory`
      }
    })
  },

  setAdminOpen: (adminOpen) => {
    if (get().soundEnabled) sound.playClick()
    set({ adminOpen })
  },

  add: (id, count = 1) => {
    const s = get()
    if (s.soundEnabled) sound.playIronClank()
    const item = s.products.find(p => p.id === id)
    set(state => ({
      cart: { ...state.cart, [id]: (state.cart[id] || 0) + count },
      open: true,
      toast: `Added ${item?.t || 'item'} to cart`
    }))
  },

  addMultiple: (ids) => {
    const s = get()
    if (s.soundEnabled) sound.playIronClank()
    set(state => {
      const nextCart = { ...state.cart }
      ids.forEach(id => {
        nextCart[id] = (nextCart[id] || 0) + 1
      })
      return {
        cart: nextCart,
        open: true,
        toast: `Loaded bundle stack (${ids.length} items) into cart!`
      }
    })
  },

  qty: (id, delta) => {
    const s = get()
    if (s.soundEnabled) sound.playClick()
    set(state => {
      const nextCount = (state.cart[id] || 0) + delta
      const nextCart = { ...state.cart }
      if (nextCount > 0) {
        nextCart[id] = nextCount
      } else {
        delete nextCart[id]
      }
      return { cart: nextCart }
    })
  },

  wishT: (id) => {
    const s = get()
    if (s.soundEnabled) sound.playClick()
    set(state => {
      const isWished = state.wish.includes(id)
      const nextWish = isWished ? state.wish.filter(w => w !== id) : [...state.wish, id]
      return {
        wish: nextWish,
        toast: isWished ? 'Removed from wishlist' : 'Saved to wishlist ❤️'
      }
    })
  },

  setOpen: (open) => {
    if (get().soundEnabled) sound.playClick()
    set({ open })
  },

  setWishOpen: (wishOpen) => {
    if (get().soundEnabled) sound.playClick()
    set({ wishOpen })
  },

  setQuickViewProduct: (quickViewProduct) => {
    if (get().soundEnabled) sound.playClick()
    set({ quickViewProduct })
  },

  setCheckoutOpen: (checkoutOpen) => {
    if (get().soundEnabled) sound.playClick()
    set({ checkoutOpen })
  },

  toggleSound: () => {
    const next = !get().soundEnabled
    if (next) sound.playClick()
    set({ soundEnabled: next })
  },

  applyCoupon: (code, percent) => {
    if (get().soundEnabled) sound.playSuccess()
    set({
      coupon: { code, percent },
      toast: `Coupon ${code} applied (-${percent}%)!`
    })
  },

  removeCoupon: () => {
    if (get().soundEnabled) sound.playClick()
    set({ coupon: null, toast: 'Coupon removed' })
  },

  clearCart: () => {
    set({ cart: {}, coupon: null })
  },

  showToast: (toast) => {
    set({ toast })
  }
}))

export const subtotal = (cart: Record<number, number>, productsList?: Product[]) => {
  const currentProducts = productsList || useStore.getState().products
  return Object.entries(cart).reduce((acc, [id, qty]) => {
    const p = currentProducts.find(item => item.id === +id)
    return acc + (p?.p || 0) * qty
  }, 0)
}

export const total = (
  cart: Record<number, number>,
  coupon: { code: string; percent: number } | null = null,
  productsList?: Product[]
) => {
  const sub = subtotal(cart, productsList)
  if (!coupon || !coupon.percent) return sub
  const discount = Math.round(sub * (coupon.percent / 100))
  return Math.max(0, sub - discount)
}
