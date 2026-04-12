import { useAuth } from "@/hooks/useAuthContext";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LogOut, MapPin, CreditCard, ShoppingBag } from "lucide-react";

interface Order {
  id: number;
  status: string;
  total: number;
  customerName: string;
  createdAt: string;
  items: { productName: string; quantity: number; price: number }[];
}

interface Address {
  id: number;
  fullName: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  type: string;
  isDefault: boolean;
}

export default function ProfilePage() {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [_location, setLocation] = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/sign-in");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  useEffect(() => {
    if (user) {
      fetchUserOrders();
      fetchUserAddresses();
    }
  }, [user]);

  const fetchUserOrders = async () => {
    try {
      const response = await fetch("/api/orders/user", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchUserAddresses = async () => {
    try {
      const response = await fetch("/api/addresses", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const initials = `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={async () => await logout()}
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders" className="gap-2">
              <ShoppingBag className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2">
              <MapPin className="w-4 h-4" />
              Addresses
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Methods
            </TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-4">
            {ordersLoading ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Loading orders...
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No orders yet</p>
                  <a href="/shop" className="text-primary hover:underline mt-2 inline-block">
                    Start shopping
                  </a>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Order #{order.id}</CardTitle>
                        <CardDescription>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.productName} x{item.quantity}
                          </span>
                          <span className="font-medium">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Total</span>
                      <span>${order.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-4">
            {addresses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-muted-foreground">No addresses saved</p>
                  <Button className="mt-4">Add Address</Button>
                </CardContent>
              </Card>
            ) : (
              addresses.map((addr) => (
                <Card key={addr.id}>
                  <CardContent className="py-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{addr.fullName}</p>
                        <p className="text-sm text-muted-foreground">
                          {addr.street}
                          <br />
                          {addr.city}, {addr.state} {addr.zipCode}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2 capitalize">
                          {addr.type}
                          {addr.isDefault && " • Default"}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-2 opacity-50" />
                <p>Payment methods feature coming soon</p>
                <Button variant="ghost" className="mt-4">Add Payment Method</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
