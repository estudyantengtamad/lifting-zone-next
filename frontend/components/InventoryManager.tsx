'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  AlertTriangle,
  Loader2,
  DollarSign,
  Layers,
  Sparkles,
  Database
} from 'lucide-react'
import { useStore } from '../lib/store'
import { Product, peso } from '../lib/data'
import { sound } from '../lib/audio'

const CATEGORIES = [
  'Pre-Workouts',
  'Whey Protein',
  'Creatine',
  'Leg Machines',
  'Smith Machines',
  'Free Weights'
]

const EMOJIS = ['⚡', '🥛', '💊', '🦵', '🏗️', '🏋️', '🥊', '🔥', '🏆']

export default function InventoryManager() {
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    setQuickViewProduct,
    soundEnabled
  } = useStore()

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all')

  // Modal State for Create / Edit
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  // Form Fields
  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: 'Pre-Workouts',
    price: 1990,
    originalPrice: 2490,
    stock: 20,
    type: 'S' as 'S' | 'E',
    emoji: '⚡',
    description: '',
    specs: '40 Servings, High Purity, Lab Tested',
    flavors: 'Standard, Natural',
    batchCode: ''
  })

  // Open Create Modal
  const handleOpenCreate = () => {
    if (soundEnabled) sound.playClick()
    setEditingProduct(null)
    setFormData({
      title: '',
      brand: 'RAW Nutrition',
      category: 'Pre-Workouts',
      price: 2990,
      originalPrice: 3490,
      stock: 25,
      type: 'S',
      emoji: '⚡',
      description: 'High-performance authentic gym supplement directly imported for Butuan lifters.',
      specs: '40 Servings, 300mg Caffeine, Pure Compound, Lab Tested',
      flavors: 'Sour Watermelon, Blue Raspberry, Unflavored',
      batchCode: `LZO-${Math.floor(1000 + Math.random() * 9000)}`
    })
    setIsModalOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: Product) => {
    if (soundEnabled) sound.playClick()
    setEditingProduct(p)
    setFormData({
      title: p.t,
      brand: p.b,
      category: p.c,
      price: p.p,
      originalPrice: p.o,
      stock: p.s,
      type: p.ty,
      emoji: p.e,
      description: p.desc,
      specs: p.specs.join(', '),
      flavors: p.flavors.join(', '),
      batchCode: p.batchCode
    })
    setIsModalOpen(true)
  }

  // Save (Create or Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    const specsArray = formData.specs
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
    const flavorsArray = formData.flavors
      .split(',')
      .map(f => f.trim())
      .filter(Boolean)

    if (editingProduct) {
      // UPDATE
      const payload = {
        id: editingProduct.id,
        t: formData.title,
        b: formData.brand,
        c: formData.category,
        p: Number(formData.price),
        o: Number(formData.originalPrice),
        s: Number(formData.stock),
        ty: formData.type,
        e: formData.emoji,
        desc: formData.description,
        specs: specsArray,
        flavors: flavorsArray
      }

      try {
        await fetch('/api/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } catch (err) {
        console.warn('API update failed, updating local state:', err)
      }

      updateProduct({
        ...editingProduct,
        ...payload
      })
    } else {
      // CREATE
      const payload = {
        title: formData.title,
        brand: formData.brand,
        category: formData.category,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice),
        stock: Number(formData.stock),
        type: formData.type,
        emoji: formData.emoji,
        description: formData.description,
        specs: specsArray,
        flavors: flavorsArray,
        batchCode: formData.batchCode || `LZO-${Math.floor(1000 + Math.random() * 9000)}`
      }

      let createdProduct: Product | null = null
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.success && data.data) {
          createdProduct = data.data
        }
      } catch (err) {
        console.warn('API create failed, adding to local state:', err)
      }

      if (!createdProduct) {
        const nextId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 0
        createdProduct = {
          id: nextId,
          t: formData.title,
          b: formData.brand,
          c: formData.category,
          p: Number(formData.price),
          o: Number(formData.originalPrice),
          r: 5.0,
          n: 1,
          s: Number(formData.stock),
          ty: formData.type,
          e: formData.emoji,
          desc: formData.description,
          specs: specsArray,
          flavors: flavorsArray,
          batchCode: formData.batchCode || `LZO-${Math.floor(1000 + Math.random() * 9000)}`,
          authenticity: 'Direct USA/UK Import Verified'
        }
      }

      addProduct(createdProduct)
    }

    setIsSaving(false)
    setIsModalOpen(false)
  }

  // Delete
  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/products?id=${id}`, { method: 'DELETE' })
    } catch (err) {
      console.warn('API delete failed, removing from local state:', err)
    }
    deleteProduct(id)
    setDeleteConfirmId(null)
  }

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const matchesSearch =
      (p.t + p.b + p.c + p.batchCode).toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || p.c === selectedCategory
    const matchesStock =
      stockFilter === 'all'
        ? true
        : stockFilter === 'low'
        ? p.s > 0 && p.s <= 10
        : p.s === 0
    return matchesSearch && matchesCategory && matchesStock
  })

  // Inventory Summary Metrics
  const totalSKUs = products.length
  const totalValuation = products.reduce((acc, p) => acc + p.p * p.s, 0)
  const lowStockCount = products.filter(p => p.s > 0 && p.s <= 10).length
  const outOfStockCount = products.filter(p => p.s === 0).length

  return (
    <section id="inventory-admin" className="mx-auto max-w-7xl px-4 py-20 text-[var(--color-text)] transition-colors duration-200">
      {/* Container in signature Green, White & Slate theme */}
      <div className="rounded-[3rem] border border-line bg-card p-8 md:p-12 shadow-xl relative overflow-hidden dark:border-[#1a3822] dark:bg-gradient-to-b dark:from-[#07130a] dark:via-[#050806] dark:to-[#0a1e11] dark:shadow-2xl">
        {/* Glow */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

        {/* Header */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-line dark:border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-400">
              <Database size={14} className="text-brand-500" />
              Real-Time Stock &amp; Warehouse Control
            </div>
            <h2 className="font-solare text-3xl md:text-5xl mt-1 tracking-tight text-[var(--color-text)] font-normal">
              Facility <span className="italic font-normal text-brand-500">Inventory</span>
            </h2>
            <p className="mt-1 text-xs md:text-sm text-[var(--color-text-muted)]">
              Live stock monitoring, SKU pricing, lot certifications, and warehouse records.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="solare-pill-btn flex items-center gap-2.5 rounded-full bg-brand-500 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-[var(--color-btn-text)] shadow-neon hover:bg-brand-400 transition self-start md:self-auto"
          >
            <Plus size={16} className="btn-arrow-1 text-[var(--color-btn-text)]" />
            <Sparkles size={16} className="btn-arrow-2 text-[var(--color-btn-text)]" />
            <span>Add New Item</span>
          </button>
        </div>

        {/* Summary Metrics Bar */}
        <div className="relative z-10 my-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-line bg-elev/60 p-4 dark:border-white/10 dark:bg-black/50">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] block">Active SKUs</span>
            <div className="font-head text-3xl font-black text-[var(--color-text)] mt-1">{totalSKUs}</div>
            <span className="text-[10px] text-brand-400">Live in Catalog</span>
          </div>

          <div className="rounded-2xl border border-line bg-elev/60 p-4 dark:border-white/10 dark:bg-black/50">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] block">Total Asset Value</span>
            <div className="font-head text-2xl font-black text-brand-400 mt-1 truncate">
              {peso(totalValuation)}
            </div>
            <span className="text-[10px] text-[var(--color-text-subtle)]">Gross Stock Valuation</span>
          </div>

          <div className="rounded-2xl border border-line bg-elev/60 p-4 dark:border-white/10 dark:bg-black/50">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] block">Low Stock Alert</span>
            <div className="font-head text-3xl font-black text-amber-500 mt-1">{lowStockCount}</div>
            <span className="text-[10px] text-amber-500/80">≤ 10 Units Left</span>
          </div>

          <div className="rounded-2xl border border-line bg-elev/60 p-4 dark:border-white/10 dark:bg-black/50">
            <span className="text-[10px] uppercase font-bold text-[var(--color-text-subtle)] block">Sold Out</span>
            <div className="font-head text-3xl font-black text-red-500 mt-1">{outOfStockCount}</div>
            <span className="text-[10px] text-red-500/80">Needs Restock</span>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="relative z-10 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search size={15} className="absolute left-3.5 top-3 text-[var(--color-text-subtle)]" />
            <input
              type="text"
              placeholder="Search by Title, Brand, Batch Code…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-full border border-line bg-card py-2 pl-10 pr-4 text-xs text-[var(--color-text)] placeholder-[var(--color-text-subtle)] outline-none focus:border-brand-500 dark:bg-black/60 dark:border-white/15 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="rounded-full border border-line bg-card px-3 py-2 text-xs text-[var(--color-text)] outline-none focus:border-brand-500 dark:bg-black/60 dark:border-white/15 dark:text-white"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex rounded-full bg-card p-1 border border-line text-xs dark:bg-white/5 dark:border-white/10">
              <button
                onClick={() => setStockFilter('all')}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  stockFilter === 'all' ? 'bg-brand-500 text-[var(--color-btn-text)]' : 'text-[var(--color-text-muted)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStockFilter('low')}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  stockFilter === 'low' ? 'bg-amber-400 text-black' : 'text-[var(--color-text-muted)]'
                }`}
              >
                Low
              </button>
              <button
                onClick={() => setStockFilter('out')}
                className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                  stockFilter === 'out' ? 'bg-red-500 text-white' : 'text-[var(--color-text-muted)]'
                }`}
              >
                Out
              </button>
            </div>
          </div>
        </div>

        {/* Inventory Data Table (READ) */}
        <div className="relative z-10 overflow-x-auto rounded-2xl border border-line bg-card dark:border-white/10 dark:bg-black/40">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-line bg-elev/60 uppercase tracking-wider text-[10px] text-[var(--color-text-subtle)] dark:border-white/10 dark:bg-white/5">
              <tr>
                <th className="py-3 px-4">SKU / Item</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock Level</th>
                <th className="py-3 px-4">Batch Code</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line dark:divide-white/5">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-elev/40 transition">
                  <td className="py-3 px-4 flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-elev text-lg overflow-hidden p-0.5 border border-line dark:bg-white/10">
                      {p.image ? (
                        <img src={p.image} alt={p.t} className="h-full w-full object-contain" />
                      ) : (
                        p.e
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--color-text)] truncate max-w-xs">{p.t}</div>
                      <div className="text-[10px] text-[var(--color-text-subtle)]">{p.b}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-[var(--color-text-muted)]">
                    <span className="rounded-full bg-elev border border-line px-2 py-0.5 text-[10px]">
                      {p.c}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-brand-400">{peso(p.p)}</td>
                  <td className="py-3 px-4">
                    {p.s === 0 ? (
                      <span className="rounded-full bg-red-500/20 text-red-500 border border-red-500/30 px-2 py-0.5 text-[10px] font-bold">
                        Out of stock (0)
                      </span>
                    ) : p.s <= 10 ? (
                      <span className="rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 px-2 py-0.5 text-[10px] font-bold">
                        Low: {p.s} units
                      </span>
                    ) : (
                      <span className="rounded-full bg-brand-500/20 text-brand-400 border border-brand-500/30 px-2 py-0.5 text-[10px] font-bold">
                        In stock ({p.s})
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[var(--color-text-subtle)]">{p.batchCode}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="rounded-lg border border-line bg-elev p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:border-brand-500 transition dark:border-white/15 dark:bg-white/5 dark:text-white/70"
                        title="Edit Item"
                      >
                        <Pencil size={13} />
                      </button>

                      {deleteConfirmId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="rounded-lg bg-red-500 p-1.5 text-white hover:bg-red-600 transition"
                            title="Confirm Delete"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="rounded-lg bg-elev p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition border border-line"
                            title="Cancel"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(p.id)}
                          className="rounded-lg border border-line bg-elev p-1.5 text-[var(--color-text-subtle)] hover:text-red-500 hover:border-red-400/50 transition dark:border-white/15 dark:bg-white/5"
                          title="Delete Item"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredProducts.length && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/50">
                    No matching inventory items found. Click &quot;Create New SKU&quot; to add one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT MODAL (CREATE / UPDATE) */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-card p-6 shadow-2xl dark:border-[#16c45a]/50 dark:bg-gradient-to-b dark:from-[#07130a] dark:via-[#050806] dark:to-[#0a1e11] md:p-8"
            >
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full border border-line bg-elev text-[var(--color-text-subtle)] hover:text-[var(--color-text)] dark:border-white/15 dark:bg-black dark:text-white/70 dark:hover:text-white"
              >
                <X size={16} />
              </button>

              <div className="mb-6">
                <span className="eyebrow text-xs">
                  {editingProduct ? 'Update Inventory SKU' : 'Add New Inventory SKU'}
                </span>
                <h3 className="mt-1 font-solare text-2xl text-[var(--color-text)] dark:text-white md:text-3xl">
                  {editingProduct ? 'Edit Supplement Item' : 'Create New Supplement Product'}
                </h3>
              </div>

              <form onSubmit={handleSave} className="space-y-4 text-xs">
                {/* Title & Brand */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Product Title:
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.title}
                      onChange={e => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. CBUM Itholate Pre-Workout"
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Brand / Manufacturer:
                    </label>
                    <input
                      required
                      type="text"
                      value={formData.brand}
                      onChange={e => setFormData({ ...formData, brand: e.target.value })}
                      placeholder="e.g. RAW Nutrition, Hammer Strength"
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>
                </div>

                {/* Category & Type */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Category:
                    </label>
                    <select
                      value={formData.category}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          category: e.target.value,
                          type:
                            e.target.value === 'Leg Machines' ||
                            e.target.value === 'Smith Machines' ||
                            e.target.value === 'Free Weights'
                              ? 'E'
                              : 'S'
                        })
                      }
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Emoji Icon:
                    </label>
                    <div className="flex flex-wrap gap-1.5 rounded-xl border border-line bg-elev p-1 dark:border-white/15 dark:bg-black/60">
                      {EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setFormData({ ...formData, emoji: em })}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg text-sm transition ${
                            formData.emoji === em ? 'bg-brand-500 text-white dark:bg-[#16c45a] dark:text-black' : 'hover:bg-black/5 dark:hover:bg-white/10'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Price & Original Price & Stock */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Selling Price (₱):
                    </label>
                    <input
                      required
                      type="number"
                      min={100}
                      value={formData.price}
                      onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Original Price (₱):
                    </label>
                    <input
                      required
                      type="number"
                      min={100}
                      value={formData.originalPrice}
                      onChange={e =>
                        setFormData({ ...formData, originalPrice: Number(e.target.value) })
                      }
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Stock Count:
                    </label>
                    <input
                      required
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>
                </div>

                {/* Batch Code */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                    Batch / Lot Code:
                  </label>
                  <input
                    type="text"
                    value={formData.batchCode}
                    onChange={e => setFormData({ ...formData, batchCode: e.target.value })}
                    placeholder="e.g. RAW-8821-CBUM"
                    className="w-full rounded-xl border border-line bg-elev p-2.5 font-mono text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                  />
                </div>

                {/* Specs & Flavors */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Specs (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={formData.specs}
                      onChange={e => setFormData({ ...formData, specs: e.target.value })}
                      placeholder="40 Servings, High Purity, 300mg Stim"
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                      Flavors / Options (comma-separated):
                    </label>
                    <input
                      type="text"
                      value={formData.flavors}
                      onChange={e => setFormData({ ...formData, flavors: e.target.value })}
                      placeholder="Sour Peach, Rocket Candy"
                      className="w-full rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="mb-1 block text-[11px] font-bold text-[var(--color-text-muted)] dark:text-white/60">
                    Description:
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Product details, dosage guidelines, structural specs…"
                    className="w-full resize-none rounded-xl border border-line bg-elev p-2.5 text-[var(--color-text)] outline-none focus:border-brand-500 dark:border-white/15 dark:bg-black/60 dark:text-white dark:focus:border-[#16c45a]"
                  />
                </div>

                {/* Submit button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn w-full !py-3 flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Saving to Supabase & Store…
                      </>
                    ) : (
                      <>
                        <Check size={14} />
                        {editingProduct ? 'Save Changes' : 'Publish SKU to Supplements'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  )
}
