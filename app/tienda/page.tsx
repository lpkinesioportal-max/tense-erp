"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Package,
  Trash2,
  CreditCard,
  Banknote,
  CheckCircle,
  ArrowLeft,
  User,
  Stethoscope,
  X,
} from "lucide-react"
import type { Product, ProductSaleItem } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"

interface CartItem extends ProductSaleItem {
  product: Product
}

export default function TiendaPage() {
  const { products, productCategories, getProductStockStatus, addProductSale, bankAccounts, clients, professionals } =
    useData()
  const { user, hasPermission } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isSuccessOpen, setIsSuccessOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "transfer">("cash")
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string>("")

  const [buyerSearch, setBuyerSearch] = useState("")
  const [selectedBuyer, setSelectedBuyer] = useState<{
    type: "client" | "professional"
    id: string
    name: string
  } | null>(null)
  const [showBuyerDropdown, setShowBuyerDropdown] = useState(false)

  const safeClients = clients || []
  const safeProfessionals = professionals || []

  const filteredBuyers =
    buyerSearch.trim().length > 0
      ? [
          ...safeClients
            .filter(
              (c) =>
                c.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
                c.email?.toLowerCase().includes(buyerSearch.toLowerCase()) ||
                c.phone?.includes(buyerSearch) ||
                c.dni?.includes(buyerSearch),
            )
            .slice(0, 5)
            .map((c) => ({ type: "client" as const, id: c.id, name: c.name, detail: c.phone || c.email || "" })),
          ...safeProfessionals
            .filter(
              (p) =>
                p.name.toLowerCase().includes(buyerSearch.toLowerCase()) ||
                p.email?.toLowerCase().includes(buyerSearch.toLowerCase()),
            )
            .slice(0, 5)
            .map((p) => ({ type: "professional" as const, id: p.id, name: p.name, detail: p.specialty || "" })),
        ]
      : []

  const activeProducts = (products || []).filter((p) => p.isActive && p.currentStock > 0)

  const filteredProducts = activeProducts.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getStockBadge = (product: Product) => {
    const status = getProductStockStatus(product)
    if (status === "bajo")
      return (
        <Badge variant="destructive" className="text-xs">
          Últimas unidades
        </Badge>
      )
    if (status === "medio") return <Badge className="bg-yellow-500 text-xs">Stock limitado</Badge>
    return <Badge className="bg-green-500 text-xs">Disponible</Badge>
  }

  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.productId === product.id)
    if (existing) {
      if (existing.quantity < product.currentStock) {
        setCart(
          cart.map((item) =>
            item.productId === product.id
              ? { ...item, quantity: item.quantity + 1, totalPrice: (item.quantity + 1) * item.unitPrice }
              : item,
          ),
        )
      }
    } else {
      setCart([
        ...cart,
        {
          productId: product.id,
          product,
          quantity: 1,
          unitPrice: product.salePrice,
          totalPrice: product.salePrice,
        },
      ])
    }
  }

  const updateCartQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.productId === productId) {
            const newQuantity = item.quantity + delta
            if (newQuantity <= 0) return null
            if (newQuantity > item.product.currentStock) return item
            return { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
          }
          return item
        })
        .filter(Boolean) as CartItem[],
    )
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.productId !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + item.totalPrice, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  const handleCheckout = () => {
    const saleItems: ProductSaleItem[] = cart.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }))

    const sale = addProductSale({
      date: new Date(),
      clientId: selectedBuyer?.type === "client" ? selectedBuyer.id : undefined,
      professionalId: selectedBuyer?.type === "professional" ? selectedBuyer.id : undefined,
      clientName: selectedBuyer?.name || buyerSearch.trim() || undefined,
      items: saleItems,
      totalAmount: cartTotal,
      paymentMethod,
      bankAccountId: paymentMethod === "transfer" ? selectedBankAccountId : undefined,
      origin: "store",
    })

    if (sale) {
      setCart([])
      setIsCheckoutOpen(false)
      setIsSuccessOpen(true)
      setBuyerSearch("")
      setSelectedBuyer(null)
    }
  }

  const handleGoBack = () => {
    if (hasPermission(["super_admin", "admin", "recepcionista"])) {
      router.push("/dashboard")
    } else {
      router.push("/mi-cuenta")
    }
  }

  useEffect(() => {
    console.log("[v0] Tienda - products from context:", products)
    console.log("[v0] Tienda - products length:", products?.length)
    console.log("[v0] Tienda - activeProducts:", activeProducts)
    console.log("[v0] Tienda - activeProducts length:", activeProducts.length)
  }, [products, activeProducts])

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {user && (
                <Button variant="ghost" size="sm" onClick={handleGoBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  {hasPermission(["super_admin", "admin", "recepcionista"]) ? "Volver al sistema" : "Mi cuenta"}
                </Button>
              )}
              <div>
                <h1 className="text-2xl font-bold text-sky-600">TENSE Store</h1>
                <p className="text-sm text-muted-foreground">Productos para tu bienestar</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="relative bg-transparent"
              onClick={() => cart.length > 0 && setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Carrito
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-sky-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {productCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground">No hay productos disponibles</h2>
            <p className="text-muted-foreground">Vuelve pronto para ver nuestras novedades</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const cartItem = cart.find((item) => item.productId === product.id)
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl || "/placeholder.svg"}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-16 w-16 text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">{getStockBadge(product)}</div>
                  </div>
                  <CardContent className="p-4">
                    <Badge variant="outline" className="mb-2">
                      {product.category}
                    </Badge>
                    <h3 className="font-semibold text-lg line-clamp-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
                    )}
                    <p className="text-2xl font-bold text-sky-600 mt-2">{formatCurrency(product.salePrice)}</p>
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    {cartItem ? (
                      <div className="flex items-center justify-between w-full">
                        <Button size="icon" variant="outline" onClick={() => updateCartQuantity(product.id, -1)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold">{cartItem.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateCartQuantity(product.id, 1)}
                          disabled={cartItem.quantity >= product.currentStock}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button className="w-full bg-sky-500 hover:bg-sky-600" onClick={() => addToCart(product)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar al carrito
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        )}
      </main>

      {/* Floating Cart Summary */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80">
          <Card className="shadow-xl border-sky-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-semibold">{cartCount} productos</span>
                <span className="text-xl font-bold text-sky-600">{formatCurrency(cartTotal)}</span>
              </div>
              <Button className="w-full bg-sky-500 hover:bg-sky-600" onClick={() => setIsCheckoutOpen(true)}>
                Ir al checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Finalizar compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Cart Items */}
            <div className="space-y-2">
              <Label>Productos en el carrito</Label>
              {cart.map((item) => (
                <div key={item.productId} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl || "/placeholder.svg"}
                        alt={item.product.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <Package className="w-10 h-10 p-2 bg-background rounded" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{formatCurrency(item.totalPrice)}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => removeFromCart(item.productId)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Label>Cliente o Profesional (opcional)</Label>
              {selectedBuyer ? (
                <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    {selectedBuyer.type === "client" ? (
                      <User className="h-4 w-4 text-primary" />
                    ) : (
                      <Stethoscope className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <p className="font-medium">{selectedBuyer.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedBuyer.type === "client" ? "Cliente" : "Profesional"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={() => {
                      setSelectedBuyer(null)
                      setBuyerSearch("")
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={buyerSearch}
                    onChange={(e) => {
                      setBuyerSearch(e.target.value)
                      setShowBuyerDropdown(true)
                    }}
                    onFocus={() => setShowBuyerDropdown(true)}
                    placeholder="Buscar por nombre, DNI, teléfono o email..."
                    className="pl-10"
                  />
                  {showBuyerDropdown && filteredBuyers.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredBuyers.map((buyer) => (
                        <button
                          key={`${buyer.type}-${buyer.id}`}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left transition-colors"
                          onClick={() => {
                            setSelectedBuyer({ type: buyer.type, id: buyer.id, name: buyer.name })
                            setBuyerSearch("")
                            setShowBuyerDropdown(false)
                          }}
                        >
                          {buyer.type === "client" ? (
                            <User className="h-4 w-4 text-blue-500 shrink-0" />
                          ) : (
                            <Stethoscope className="h-4 w-4 text-green-500 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{buyer.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {buyer.type === "client" ? "Cliente" : "Profesional"}
                              {buyer.detail && ` • ${buyer.detail}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {showBuyerDropdown && buyerSearch.trim().length > 0 && filteredBuyers.length === 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg p-3">
                      <p className="text-sm text-muted-foreground text-center">
                        No se encontraron resultados. Se usará "{buyerSearch}" como nombre.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Método de pago</Label>
              <RadioGroup value={paymentMethod} onValueChange={(v: "cash" | "transfer") => setPaymentMethod(v)}>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex items-center gap-2 cursor-pointer flex-1">
                    <Banknote className="h-5 w-5 text-green-600" />
                    Efectivo
                  </Label>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg">
                  <RadioGroupItem value="transfer" id="transfer" />
                  <Label htmlFor="transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                    Transferencia bancaria
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Bank Account Selection */}
            {paymentMethod === "transfer" && bankAccounts.length > 0 && (
              <div className="space-y-2">
                <Label>Cuenta destino</Label>
                <Select value={selectedBankAccountId} onValueChange={setSelectedBankAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cuenta" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.bankName} - {acc.alias || acc.accountNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Total */}
            <div className="p-4 bg-sky-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-lg font-semibold">Total a pagar</span>
                <span className="text-2xl font-bold text-sky-600">{formatCurrency(cartTotal)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCheckout} className="bg-sky-500 hover:bg-sky-600">
              Confirmar compra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={isSuccessOpen} onOpenChange={setIsSuccessOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">¡Compra realizada!</h2>
            <p className="text-muted-foreground">
              Tu compra ha sido registrada exitosamente. Gracias por tu preferencia.
            </p>
          </div>
          <Button onClick={() => setIsSuccessOpen(false)} className="w-full">
            Continuar comprando
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
