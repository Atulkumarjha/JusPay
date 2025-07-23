'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Settings, Users, CreditCard, TrendingUp, Coins } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

interface Stats {
  total_users: number
  total_orders: number
  total_revenue: number
  total_wallet_balance: number
  total_glo_coins: number
}

interface Gateway {
  name: string
  displayName: string
  active: boolean
}

interface Order {
  order_id: string
  username: string
  amount: number
  gateway: string
  gateway_display: string
  status: string
  created_at: string
}

interface User {
  id: number
  username: string
  email: string
  role: string
  wallet_balance: number
  glo_coin_balance: number
  total_withdrawn: number
  created_at: string
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [gateways, setGateways] = useState<Gateway[]>([])
  const [orders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [currentGateway, setCurrentGateway] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [switching, setSwitching] = useState(false)
  const [user, setUser] = useState<{ role?: string } | null>(null)

  useEffect(() => {
    // Check authentication - only run on client side
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (!token || !userData) {
      window.location.href = '/login'
      return
    }
    
    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'admin') {
      toast.error('Access denied. Admin privileges required.')
      window.location.href = '/login'
      return
    }
    
    setUser(parsedUser)
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch('http://localhost:8000/api/admin/stats'),
        fetch('http://localhost:8000/api/users')
      ])

      const [statsData, usersData] = await Promise.all([
        statsRes.json(),
        usersRes.json()
      ])

      // Transform backend data to match frontend expectations
      setStats({
        total_users: statsData.totalUsers || 0,
        total_orders: statsData.totalOrders || 0,
        total_revenue: statsData.revenue || 0,
        total_wallet_balance: 50000,
        total_glo_coins: 125000
      })

      setUsers(usersData || [])
      
      // Set default gateway data
      setGateways([
        { name: 'juspay', displayName: 'JusPay', active: true },
        { name: 'cashfree', displayName: 'Cashfree', active: false }
      ])
      setCurrentGateway('juspay')
      
    } catch {
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleGatewayToggle = async (checked: boolean) => {
    const newGateway = checked ? 'cashfree' : 'juspay'
    
    if (newGateway === currentGateway) return

    setSwitching(true)
    
    try {
      const response = await fetch('/api/admin/switch-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gateway: newGateway })
      })

      const data = await response.json()

      if (data.success) {
        setCurrentGateway(newGateway)
        const gatewayDisplayName = newGateway === 'cashfree' ? 'Gateway B (Cashfree)' : 'Gateway A (JusPay)'
        toast.success(`✅ Gateway switched to ${gatewayDisplayName}!`)
        loadData()
      } else {
        toast.error(data.error || 'Failed to switch gateway')
      }
    } catch {
      toast.error('Error switching payment gateway')
    } finally {
      setSwitching(false)
    }
  }

  const logout = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    toast.success('Logged out successfully')
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            initial={{ x: Math.random() * 1200, y: 800 }}
            animate={{ 
              y: -50,
              x: Math.random() * 1200,
              rotate: 360
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-6 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="w-8 h-8 text-white" />
            Gateway Management Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-white font-semibold">Admin</span>
            <Button 
              onClick={logout}
              variant="destructive" 
              className="bg-red-500/90 hover:bg-red-600 backdrop-blur-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="bg-white/95 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <TrendingUp className="w-6 h-6" />
                Payment Gateway Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard
                  icon={<Users className="w-8 h-8" />}
                  label="Total Users"
                  value={stats?.total_users || 0}
                  loading={loading}
                />
                <StatCard
                  icon={<CreditCard className="w-8 h-8" />}
                  label="Total Orders"
                  value={stats?.total_orders || 0}
                  loading={loading}
                />
                <StatCard
                  icon={<TrendingUp className="w-8 h-8" />}
                  label="Total Revenue"
                  value={`₹${(stats?.total_revenue || 0).toFixed(2)}`}
                  loading={loading}
                />
                <StatCard
                  icon={<CreditCard className="w-8 h-8" />}
                  label="Wallet Balance"
                  value={`₹${(stats?.total_wallet_balance || 0).toFixed(2)}`}
                  loading={loading}
                />
                <StatCard
                  icon={<Coins className="w-8 h-8" />}
                  label="Platform Tokens"
                  value={(stats?.total_glo_coins || 0).toFixed(2)}
                  loading={loading}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gateway Control */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-white/95 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <Settings className="w-6 h-6" />
                  Gateway Switching Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Gateway Toggle */}
                <div className="bg-blue-50 p-6 rounded-xl text-center">
                  <h3 className="text-lg font-semibold text-blue-800 mb-4">Quick Gateway Switch</h3>
                  
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <span className="font-bold text-gray-700">Gateway A (JusPay)</span>
                    <Switch
                      checked={currentGateway === 'cashfree'}
                      onCheckedChange={handleGatewayToggle}
                      disabled={switching || loading}
                      className="data-[state=checked]:bg-cyan-500"
                    />
                    <span className="font-bold text-gray-700">Gateway B (Cashfree)</span>
                  </div>

                  <div className={`p-4 rounded-lg border-2 font-bold text-lg ${
                    currentGateway === 'cashfree' 
                      ? 'border-cyan-500 text-cyan-600 bg-cyan-50' 
                      : 'border-blue-500 text-blue-600 bg-blue-50'
                  }`}>
                    {switching ? '⏳ Switching...' : 
                     currentGateway === 'cashfree' ? '🟢 Gateway B (Cashfree) Active' : '🟣 Gateway A (JusPay) Active'
                    }
                  </div>
                </div>

                {/* Gateway Status Details */}
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Gateway Status Details</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {gateways.map((gateway) => (
                      <div 
                        key={gateway.name}
                        className={`p-3 border-2 rounded-lg text-center transition-all ${
                          gateway.active ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}
                      >
                        <div className="font-bold">{gateway.displayName}</div>
                        <Badge variant={gateway.active ? "default" : "secondary"} className="mt-1">
                          {gateway.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Orders */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-white/95 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-800">
                  <CreditCard className="w-6 h-6" />
                  Recent Orders
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-8">Loading...</div>
                    ) : orders.length === 0 ? (
                      <div className="text-center py-8">No orders found</div>
                    ) : (
                      orders.slice(0, 10).map((order) => (
                        <div key={order.order_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-semibold">{order.order_id}</div>
                            <div className="text-sm text-gray-600">{order.username || 'Unknown'}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">₹{(order.amount / 100).toFixed(2)}</div>
                            <div className="flex gap-2">
                              <Badge variant={order.gateway === 'juspay' ? 'default' : 'secondary'}>
                                {order.gateway_display}
                              </Badge>
                              <Badge variant={order.status === 'SUCCESS' ? 'default' : order.status === 'PENDING' ? 'secondary' : 'destructive'}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="bg-white/95 backdrop-blur-xl border-white/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Users className="w-6 h-6" />
                Users Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="text-center py-8">Loading...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8">No users found</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map((user) => (
                      <div key={user.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-bold">{user.username}</div>
                            <div className="text-sm text-gray-600">{user.email || 'No email'}</div>
                          </div>
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role || 'user'}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Wallet: ₹{(user.wallet_balance || 0).toFixed(2)}</div>
                          <div>Tokens: {(user.glo_coin_balance || 0).toFixed(2)}</div>
                          <div>Withdrawn: ₹{(user.total_withdrawn || 0).toFixed(2)}</div>
                          <div>Joined: {new Date(user.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, loading }: { 
  icon: React.ReactNode
  label: string 
  value: string | number
  loading: boolean 
}) {
  return (
    <motion.div 
      className="bg-white/90 p-4 rounded-xl border-l-4 border-blue-500 text-center"
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex justify-center mb-2 text-blue-600">
        {icon}
      </div>
      <div className="text-2xl font-bold text-blue-600 mb-1">
        {loading ? '-' : value}
      </div>
      <div className="text-gray-600 font-semibold text-sm">{label}</div>
    </motion.div>
  )
}
