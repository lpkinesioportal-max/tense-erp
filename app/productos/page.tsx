"use client"

import { useState } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Truck,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
} from "lucide-react"
import type { Product, Supplier } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

export default function ProductosPage() {
  const { hasPermission } = useAuth()
  const isSuperAdmin = hasPermission(["super_admin"])

  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    productPurchases,
    addProductPurchase,
    productCategories,
    addProductCategory,
    getProductStockStatus,
    getProductPurchaseHistory,
    getProductCostAnalysis,
    productSales,
  } = useData()

  const availableTabs = ["productos", "proveedores", "stock"]

  const [activeTab, setActiveTab] = useState("productos")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [stockFilter, setStockFilter] = useState<string>("all")

  // Product dialog
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [productFormData, setProductFormData] = useState({
    name: "",
    description: "",
    category: "",
    imageUrl: "",
    mainSupplierId: "",
    relatedSupplierIds: [] as string[],
    salePrice: 0,
    currentStock: 0,
    stockMinimo: 5,
    stockMedio: 15,
    unitMeasure: "unidad",
    isActive: true,
  })

  // Supplier dialog
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [supplierFormData, setSupplierFormData] = useState({
    name: "",
    contactName: "",
    phone: "",
    email: "",
    notes: "",
    isActive: true,
  })

  // Stock update dialog
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false)
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null)
  const [stockFormData, setStockFormData] = useState({
    supplierId: "",
    quantity: 0,
    unitCost: 0,
    paymentMethod: "cash" as "cash" | "transfer",
    notes: "",
  })

  // Product history dialog
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false)
  const [selectedProductForHistory, setSelectedProductForHistory] = useState<Product | null>(null)

  // Category dialog
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")

  // Finance filters
  const [financeMonth, setFinanceMonth] = useState(new Date().getMonth())
  const [financeYear, setFinanceYear] = useState(new Date().getFullYear())

  const filteredProducts = (products || []).filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
    const matchesStock = stockFilter === "all" || getProductStockStatus(p) === stockFilter
    return matchesSearch && matchesCategory && matchesStock
  })

  const handleProductSubmit = () => {
    if (editingProduct) {
      updateProduct(editingProduct.id, productFormData)
    } else {
      addProduct(productFormData)
    }
    setIsProductDialogOpen(false)
    setEditingProduct(null)
    resetProductForm()
  }

  const resetProductForm = () => {
    setProductFormData({
      name: "",
      description: "",
      category: "",
      imageUrl: "",
      mainSupplierId: "",
      relatedSupplierIds: [],
      salePrice: 0,
      currentStock: 0,
      stockMinimo: 5,
      stockMedio: 15,
      unitMeasure: "unidad",
      isActive: true,
    })
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setProductFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      imageUrl: product.imageUrl || "",
      mainSupplierId: product.mainSupplierId || "",
      relatedSupplierIds: product.relatedSupplierIds || [],
      salePrice: product.salePrice,
      currentStock: product.currentStock,
      stockMinimo: product.stockMinimo,
      stockMedio: product.stockMedio,
      unitMeasure: product.unitMeasure || "unidad",
      isActive: product.isActive,
    })
    setIsProductDialogOpen(true)
  }

  const openNewProductDialog = () => {
    setEditingProduct(null)
    resetProductForm()
    setIsProductDialogOpen(true)
  }

  const openEditProductDialog = (product: Product) => {
    setEditingProduct(product)
    setProductFormData({
      name: product.name,
      description: product.description || "",
      category: product.category,
      imageUrl: product.imageUrl || "",
      mainSupplierId: product.mainSupplierId || "",
      relatedSupplierIds: product.relatedSupplierIds || [],
      salePrice: product.salePrice,
      currentStock: product.currentStock,
      stockMinimo: product.stockMinimo,
      stockMedio: product.stockMedio,
      unitMeasure: product.unitMeasure || "unidad",
      isActive: product.isActive,
    })
    setIsProductDialogOpen(true)
  }

  const handleSupplierSubmit = () => {
    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierFormData)
    } else {
      addSupplier(supplierFormData)
    }
    setIsSupplierDialogOpen(false)
    setEditingSupplier(null)
    setSupplierFormData({ name: "", contactName: "", phone: "", email: "", notes: "", isActive: true })
  }

  const handleStockUpdate = () => {
    if (!selectedProductForStock) return
    addProductPurchase({
      productId: selectedProductForStock.id,
      supplierId: stockFormData.supplierId,
      purchaseDate: new Date(),
      quantity: stockFormData.quantity,
      unitCost: stockFormData.unitCost,
      totalCost: stockFormData.quantity * stockFormData.unitCost,
      paymentMethod: stockFormData.paymentMethod,
      notes: stockFormData.notes,
    })
    setIsStockDialogOpen(false)
    setSelectedProductForStock(null)
    setStockFormData({ supplierId: "", quantity: 0, unitCost: 0, paymentMethod: "cash", notes: "" })
  }

  const openStockDialog = (product: Product) => {
    setSelectedProductForStock(product)
    setIsStockDialogOpen(true)
  }

  const openHistoryDialog = (product: Product) => {
    setSelectedProductForHistory(product)
    setIsHistoryDialogOpen(true)
  }

  const getStockBadge = (product: Product) => {
    const status = getProductStockStatus(product)
    if (status === "bajo") return <Badge variant="destructive">Bajo</Badge>
    if (status === "medio") return <Badge className="bg-yellow-500">Medio</Badge>
    return <Badge className="bg-green-500">Ok</Badge>
  }

  const getSupplierName = (id: string) => {
    const supplier = (suppliers || []).find((s) => s.id === id)
    return supplier?.name || "-"
  }

  // Stats
  const totalProducts = (products || []).length
  const lowStockProducts = (products || []).filter((p) => getProductStockStatus(p) === "bajo").length
  const totalStockValue = (products || []).reduce((sum, p) => {
    const analysis = getProductCostAnalysis(p.id)
    return sum + p.currentStock * (analysis.averageCost || p.salePrice * 0.6)
  }, 0)

  const allSales = productSales || []
  const filteredSales = allSales.filter((sale) => {
    const saleDate = new Date(sale.date)
    return saleDate.getMonth() === financeMonth && saleDate.getFullYear() === financeYear
  })

  const allPurchases = productPurchases || []
  const filteredPurchases = allPurchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.purchaseDate)
    return purchaseDate.getMonth() === financeMonth && purchaseDate.getFullYear() === financeYear
  })

  const monthlyRevenue = filteredSales.reduce((sum, sale) => sum + sale.totalAmount, 0)
  const monthlyCosts = filteredPurchases.reduce((sum, purchase) => sum + purchase.totalCost, 0)
  const monthlyProfit = monthlyRevenue - monthlyCosts
  const totalSalesCount = filteredSales.length

  const cashSales = filteredSales.filter((s) => s.paymentMethod === "cash").reduce((sum, s) => sum + s.totalAmount, 0)
  const transferSales = filteredSales
    .filter((s) => s.paymentMethod === "transfer")
    .reduce((sum, s) => sum + s.totalAmount, 0)

  // Top selling products
  const productSalesMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      const product = (products || []).find((p) => p.id === item.productId)
      if (product) {
        if (!productSalesMap[item.productId]) {
          productSalesMap[item.productId] = { name: product.name, quantity: 0, revenue: 0 }
        }
        productSalesMap[item.productId].quantity += item.quantity
        productSalesMap[item.productId].revenue += item.totalPrice
      }
    })
  })
  const topProducts = Object.entries(productSalesMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Productos e Inventario</h1>
            <p className="text-muted-foreground">Gestiona productos, proveedores, stock y finanzas</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Productos</p>
                  <p className="text-2xl font-bold">{totalProducts}</p>
                </div>
                <Package className="h-8 w-8 text-sky-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Bajo</p>
                  <p className="text-2xl font-bold text-red-500">{lowStockProducts}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Valor en Stock</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalStockValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Proveedores</p>
                  <p className="text-2xl font-bold">{(suppliers || []).length}</p>
                </div>
                <Truck className="h-8 w-8 text-violet-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${isSuperAdmin ? "grid-cols-4" : "grid-cols-3"} max-w-lg`}>
            <TabsTrigger value="productos">
              <Package className="h-4 w-4 mr-2" />
              Productos
            </TabsTrigger>
            <TabsTrigger value="proveedores">
              <Truck className="h-4 w-4 mr-2" />
              Proveedores
            </TabsTrigger>
            <TabsTrigger value="stock">
              <BarChart3 className="h-4 w-4 mr-2" />
              Vista Stock
            </TabsTrigger>
          </TabsList>

          {/* PRODUCTOS TAB */}
          <TabsContent value="productos" className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar productos..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las categorías</SelectItem>
                    {(productCategories || []).map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo el stock</SelectItem>
                    <SelectItem value="ok">Stock Ok</SelectItem>
                    <SelectItem value="medio">Stock Medio</SelectItem>
                    <SelectItem value="bajo">Stock Bajo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Categoría
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>Nueva Categoría</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nombre de la categoría</Label>
                        <Input
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Ej: Suplementos"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        onClick={() => {
                          if (newCategoryName) {
                            addProductCategory({ name: newCategoryName, isActive: true })
                            setNewCategoryName("")
                            setIsCategoryDialogOpen(false)
                          }
                        }}
                      >
                        Crear
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="bg-sky-500 hover:bg-sky-600"
                      onClick={() => {
                        setEditingProduct(null)
                        resetProductForm()
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Nuevo Producto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nombre del producto *</Label>
                        <Input
                          value={productFormData.name || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                          placeholder="Ej: Proteína Whey 1kg"
                        />
                      </div>
                      <div className="col-span-2 space-y-2">
                        <Label>Descripción</Label>
                        <Textarea
                          value={productFormData.description || ""}
                          onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                          placeholder="Descripción del producto..."
                          rows={2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Categoría *</Label>
                        <Select
                          value={productFormData.category || ""}
                          onValueChange={(v) => setProductFormData({ ...productFormData, category: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(productCategories || []).map((cat) => (
                              <SelectItem key={cat.id} value={cat.name}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Unidad de medida</Label>
                        <Select
                          value={productFormData.unitMeasure || "unidad"}
                          onValueChange={(v) => setProductFormData({ ...productFormData, unitMeasure: v })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unidad">Unidad</SelectItem>
                            <SelectItem value="pack">Pack</SelectItem>
                            <SelectItem value="caja">Caja</SelectItem>
                            <SelectItem value="kg">Kilogramo</SelectItem>
                            <SelectItem value="litro">Litro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Proveedor principal</Label>
                        <Select
                          value={productFormData.mainSupplierId || ""}
                          onValueChange={(v) => setProductFormData({ ...productFormData, mainSupplierId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                          <SelectContent>
                            {(suppliers || []).map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Precio de venta *</Label>
                        <Input
                          type="number"
                          value={productFormData.salePrice ?? ""}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, salePrice: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock mínimo (alerta roja)</Label>
                        <Input
                          type="number"
                          value={productFormData.stockMinimo ?? ""}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, stockMinimo: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Stock medio (alerta amarilla)</Label>
                        <Input
                          type="number"
                          value={productFormData.stockMedio ?? ""}
                          onChange={(e) =>
                            setProductFormData({ ...productFormData, stockMedio: Number(e.target.value) || 0 })
                          }
                        />
                      </div>
                      {!editingProduct && (
                        <div className="space-y-2">
                          <Label>Stock inicial</Label>
                          <Input
                            type="number"
                            value={productFormData.currentStock ?? ""}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, currentStock: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={productFormData.isActive}
                          onCheckedChange={(v) => setProductFormData({ ...productFormData, isActive: v })}
                        />
                        <Label>Producto activo</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                        Cancelar
                      </Button>
                      <Button onClick={handleProductSubmit} className="bg-sky-500 hover:bg-sky-600">
                        {editingProduct ? "Guardar cambios" : "Crear producto"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Inventario de Productos</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar producto..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={openNewProductDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Nuevo Producto
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="col-span-2 space-y-2">
                          <Label>Nombre del producto *</Label>
                          <Input
                            value={productFormData.name || ""}
                            onChange={(e) => setProductFormData({ ...productFormData, name: e.target.value })}
                            placeholder="Ej: Proteína Whey 1kg"
                          />
                        </div>
                        <div className="col-span-2 space-y-2">
                          <Label>Descripción</Label>
                          <Textarea
                            value={productFormData.description || ""}
                            onChange={(e) => setProductFormData({ ...productFormData, description: e.target.value })}
                            placeholder="Descripción del producto..."
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Categoría *</Label>
                          <Select
                            value={productFormData.category || ""}
                            onValueChange={(v) => setProductFormData({ ...productFormData, category: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {(productCategories || []).map((cat) => (
                                <SelectItem key={cat.id} value={cat.name}>
                                  {cat.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Unidad de medida</Label>
                          <Select
                            value={productFormData.unitMeasure || "unidad"}
                            onValueChange={(v) => setProductFormData({ ...productFormData, unitMeasure: v })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unidad">Unidad</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="caja">Caja</SelectItem>
                              <SelectItem value="kg">Kilogramo</SelectItem>
                              <SelectItem value="litro">Litro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Proveedor principal</Label>
                          <Select
                            value={productFormData.mainSupplierId || ""}
                            onValueChange={(v) => setProductFormData({ ...productFormData, mainSupplierId: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {(suppliers || []).map((s) => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Precio de venta *</Label>
                          <Input
                            type="number"
                            value={productFormData.salePrice ?? ""}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, salePrice: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock mínimo (alerta roja)</Label>
                          <Input
                            type="number"
                            value={productFormData.stockMinimo ?? ""}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, stockMinimo: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Stock medio (alerta amarilla)</Label>
                          <Input
                            type="number"
                            value={productFormData.stockMedio ?? ""}
                            onChange={(e) =>
                              setProductFormData({ ...productFormData, stockMedio: Number(e.target.value) || 0 })
                            }
                          />
                        </div>
                        {!editingProduct && (
                          <div className="space-y-2">
                            <Label>Stock inicial</Label>
                            <Input
                              type="number"
                              value={productFormData.currentStock ?? ""}
                              onChange={(e) =>
                                setProductFormData({ ...productFormData, currentStock: Number(e.target.value) || 0 })
                              }
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={productFormData.isActive}
                            onCheckedChange={(v) => setProductFormData({ ...productFormData, isActive: v })}
                          />
                          <Label>Producto activo</Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsProductDialogOpen(false)}>
                          Cancelar
                        </Button>
                        <Button onClick={handleProductSubmit} className="bg-sky-500 hover:bg-sky-600">
                          {editingProduct ? "Guardar cambios" : "Crear producto"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      {isSuperAdmin && <TableHead className="text-right">Costo Prom.</TableHead>}
                      <TableHead className="text-right">Precio Venta</TableHead>
                      {isSuperAdmin && <TableHead className="text-right">Margen</TableHead>}
                      <TableHead className="text-center">Stock</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockStatus = getProductStockStatus(product)
                      const costAnalysis = getProductCostAnalysis(product.id)
                      const margin =
                        costAnalysis.averageCost > 0
                          ? ((product.salePrice - costAnalysis.averageCost) / product.salePrice) * 100
                          : 0

                      return (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {product.imageUrl ? (
                                <img
                                  src={product.imageUrl || "/placeholder.svg"}
                                  alt={product.name}
                                  className="w-10 h-10 rounded object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{product.name}</p>
                                {product.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.category}</Badge>
                          </TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right">
                              {costAnalysis.averageCost > 0 ? formatCurrency(costAnalysis.averageCost) : "-"}
                            </TableCell>
                          )}
                          <TableCell className="text-right font-medium">{formatCurrency(product.salePrice)}</TableCell>
                          {isSuperAdmin && (
                            <TableCell className="text-right">
                              {margin > 0 ? (
                                <span
                                  className={
                                    margin >= 30 ? "text-green-600" : margin >= 15 ? "text-yellow-600" : "text-red-600"
                                  }
                                >
                                  {margin.toFixed(1)}%
                                </span>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-center">
                            <span
                              className={`font-medium ${stockStatus === "bajo"
                                  ? "text-red-600"
                                  : stockStatus === "medio"
                                    ? "text-yellow-600"
                                    : "text-green-600"
                                }`}
                            >
                              {product.currentStock} {product.unitMeasure}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={product.isActive ? "default" : "secondary"}>
                              {product.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => openEditProductDialog(product)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => openStockDialog(product)}>
                                <TrendingUp className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-red-600"
                                onClick={() => deleteProduct(product.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* PROVEEDORES TAB */}
          <TabsContent value="proveedores" className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    className="bg-sky-500 hover:bg-sky-600"
                    onClick={() => {
                      setEditingSupplier(null)
                      setSupplierFormData({
                        name: "",
                        contactName: "",
                        phone: "",
                        email: "",
                        notes: "",
                        isActive: true,
                      })
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proveedor
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingSupplier ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Nombre del proveedor *</Label>
                      <Input
                        value={supplierFormData.name || ""}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nombre de contacto</Label>
                      <Input
                        value={supplierFormData.contactName || ""}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, contactName: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Teléfono</Label>
                        <Input
                          value={supplierFormData.phone || ""}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          value={supplierFormData.email || ""}
                          onChange={(e) => setSupplierFormData({ ...supplierFormData, email: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Notas</Label>
                      <Textarea
                        value={supplierFormData.notes || ""}
                        onChange={(e) => setSupplierFormData({ ...supplierFormData, notes: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={supplierFormData.isActive}
                        onCheckedChange={(v) => setSupplierFormData({ ...supplierFormData, isActive: v })}
                      />
                      <Label>Proveedor activo</Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSupplierSubmit} className="bg-sky-500 hover:bg-sky-600">
                      {editingSupplier ? "Guardar cambios" : "Crear proveedor"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(suppliers || []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No hay proveedores registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      (suppliers || []).map((supplier) => (
                        <TableRow key={supplier.id}>
                          <TableCell className="font-medium">{supplier.name}</TableCell>
                          <TableCell>{supplier.contactName || "-"}</TableCell>
                          <TableCell>{supplier.phone || "-"}</TableCell>
                          <TableCell>{supplier.email || "-"}</TableCell>
                          <TableCell>
                            <Badge variant={supplier.isActive ? "default" : "secondary"}>
                              {supplier.isActive ? "Activo" : "Inactivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingSupplier(supplier)
                                  setSupplierFormData({
                                    name: supplier.name,
                                    contactName: supplier.contactName || "",
                                    phone: supplier.phone || "",
                                    email: supplier.email || "",
                                    notes: supplier.notes || "",
                                    isActive: supplier.isActive,
                                  })
                                  setIsSupplierDialogOpen(true)
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500"
                                onClick={() => deleteSupplier(supplier.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* STOCK TAB */}
          <TabsContent value="stock" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Low Stock Products */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                    Productos con Stock Bajo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(products || [])
                      .filter((p) => getProductStockStatus(p) === "bajo")
                      .map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100"
                        >
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Stock: {product.currentStock} / Mínimo: {product.stockMinimo}
                            </p>
                          </div>
                          <Button size="sm" onClick={() => openStockDialog(product)}>
                            <Plus className="h-4 w-4 mr-1" />
                            Reponer
                          </Button>
                        </div>
                      ))}
                    {(products || []).filter((p) => getProductStockStatus(p) === "bajo").length === 0 && (
                      <p className="text-center text-muted-foreground py-4">No hay productos con stock bajo</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Stock Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen de Stock</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">Stock Ok</span>
                    <Badge className="bg-green-500">
                      {(products || []).filter((p) => getProductStockStatus(p) === "ok").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span className="text-sm">Stock Medio</span>
                    <Badge className="bg-yellow-500">
                      {(products || []).filter((p) => getProductStockStatus(p) === "medio").length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="text-sm">Stock Bajo</span>
                    <Badge variant="destructive">
                      {(products || []).filter((p) => getProductStockStatus(p) === "bajo").length}
                    </Badge>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Valor total en stock</span>
                      <span className="font-bold">{formatCurrency(totalStockValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medium Stock Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-5 w-5 text-yellow-500" />
                  Productos con Stock Medio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(products || [])
                    .filter((p) => getProductStockStatus(p) === "medio")
                    .map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100"
                      >
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">Stock: {product.currentStock}</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => openStockDialog(product)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  {(products || []).filter((p) => getProductStockStatus(p) === "medio").length === 0 && (
                    <p className="text-center text-muted-foreground py-4 col-span-full">
                      No hay productos con stock medio
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>

        {/* Stock Update Dialog */}
        <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar Stock: {selectedProductForStock?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Proveedor</Label>
                <Select
                  value={stockFormData.supplierId}
                  onValueChange={(v) => setStockFormData({ ...stockFormData, supplierId: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proveedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {(suppliers || []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    value={stockFormData.quantity ?? ""}
                    onChange={(e) => setStockFormData({ ...stockFormData, quantity: Number(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo unitario</Label>
                  <Input
                    type="number"
                    value={stockFormData.unitCost ?? ""}
                    onChange={(e) => setStockFormData({ ...stockFormData, unitCost: Number(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Medio de pago</Label>
                <Select
                  value={stockFormData.paymentMethod || "cash"}
                  onValueChange={(v) => setStockFormData({ ...stockFormData, paymentMethod: v as "cash" | "transfer" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Efectivo</SelectItem>
                    <SelectItem value="transfer">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={stockFormData.notes || ""}
                  onChange={(e) => setStockFormData({ ...stockFormData, notes: e.target.value })}
                  placeholder="Notas opcionales..."
                />
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between">
                  <span>Total de la compra:</span>
                  <span className="font-bold">{formatCurrency(stockFormData.quantity * stockFormData.unitCost)}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsStockDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleStockUpdate} className="bg-sky-500 hover:bg-sky-600">
                Registrar compra
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Product History Dialog */}
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Historial: {selectedProductForHistory?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              {selectedProductForHistory && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Stock Actual</p>
                        <p className="text-xl font-bold">{selectedProductForHistory.currentStock}</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Costo Promedio</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(getProductCostAnalysis(selectedProductForHistory.id).averageCost)}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground">Último Costo</p>
                        <p className="text-xl font-bold">
                          {formatCurrency(getProductCostAnalysis(selectedProductForHistory.id).lastCost || 0)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead className="text-center">Cantidad</TableHead>
                        <TableHead className="text-right">Costo Unit.</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getProductPurchaseHistory(selectedProductForHistory.id).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                            No hay historial de compras
                          </TableCell>
                        </TableRow>
                      ) : (
                        getProductPurchaseHistory(selectedProductForHistory.id).map((purchase) => (
                          <TableRow key={purchase.id}>
                            <TableCell>{new Date(purchase.purchaseDate).toLocaleDateString("es-AR")}</TableCell>
                            <TableCell>{getSupplierName(purchase.supplierId)}</TableCell>
                            <TableCell className="text-center">{purchase.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(purchase.unitCost)}</TableCell>
                            <TableCell className="text-right font-bold">{formatCurrency(purchase.totalCost)}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
