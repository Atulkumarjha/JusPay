'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  CreditCard, 
  Wallet, 
  TrendingUp, 
  History, 
  LogOut, 
  User,
  Coins,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface UserData {
  id: number
  username: string
  wallet_balance: number
  glo_coin_balance: number
  total_withdrawn: number
  role: string
}

interface Transaction {
  id: number
  type: string
  amount: number
  status: string
  gateway: string
  created_at: string
  description: string
}

export default function UserDashboard() {
  const [user, setUser] = useState<UserData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
    loadTransactions()
  }, [])

  const loadUserData = async () => {
    try {
      const response = await fetch('/api/user/profile')
      const data = await response.json()
      if (data.success) {
        setUser(data.user)
      }
    } catch (error) {
      toast.error('Failed to load user data')
    }
  }

  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/user/transactions')
      const data = await response.json()
      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (error) {
      toast.error('Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch('/logout', { method: 'POST' })
      window.location.href = '/login'
    } catch (error) {
      window.location.href = '/login'
    }
  }

  const initiatePayment = async (amount: number) => {
    try {
      const response = await fetch('/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount * 100, currency: 'INR' }) // Convert to paise
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Redirect to payment page or handle payment flow
        window.location.href = data.payment_url || `/payment/${data.order_id}`
      } else {
        toast.error(data.error || 'Failed to create payment')
      }
    } catch (error) {
      toast.error('Failed to initiate payment')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <motion.header 
        className="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg"
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">JusPay Dashboard</h1>
              <p className="text-blue-100 text-sm">Welcome back, {user?.username || 'User'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-right text-white">
              <p className="text-sm opacity-90">Balance</p>
              <p className="font-bold">₹{(user?.wallet_balance || 0).toFixed(2)}</p>
            </div>
            <Button 
              onClick={logout}
              variant="outline" 
              className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StatCard
            icon={<Wallet className="w-8 h-8 text-blue-600" />}
            title="Wallet Balance"
            value={`₹${(user?.wallet_balance || 0).toFixed(2)}`}
            change="+5.2%"
            positive={true}
          />
          <StatCard
            icon={<Coins className="w-8 h-8 text-yellow-600" />}
            title="Platform Tokens"
            value={(user?.glo_coin_balance || 0).toFixed(2)}
            change="+2.1%"
            positive={true}
          />
          <StatCard
            icon={<ArrowDownRight className="w-8 h-8 text-green-600" />}
            title="Total Withdrawn"
            value={`₹${(user?.total_withdrawn || 0).toFixed(2)}`}
            change="+12.5%"
            positive={true}
          />
          <StatCard
            icon={<TrendingUp className="w-8 h-8 text-purple-600" />}
            title="This Month"
            value="₹1,240.00"
            change="+8.3%"
            positive={true}
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  <span>Quick Payment</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[100, 500, 1000, 2000].map((amount) => (
                    <Button
                      key={amount}
                      onClick={() => initiatePayment(amount)}
                      variant="outline"
                      className="h-12 font-semibold hover:bg-blue-50 hover:border-blue-300"
                    >
                      ₹{amount}
                    </Button>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Custom amount"
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Pay
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Gateway Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <span>Payment Gateways</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">JP</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">JusPay</p>
                        <p className="text-sm text-gray-600">Primary Gateway</p>
                      </div>
                    </div>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">CF</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">Cashfree</p>
                        <p className="text-sm text-gray-600">Secondary Gateway</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                      Standby
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <span>Account Info</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Username:</span>
                    <span className="font-semibold">{user?.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Role:</span>
                    <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                      {user?.role || 'user'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-semibold">Jan 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="w-5 h-5 text-gray-600" />
                <span>Recent Transactions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading transactions...</div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No transactions found
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {transactions.map((transaction) => (
                    <div 
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          transaction.type === 'credit' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.type === 'credit' ? 
                            <ArrowDownRight className="w-5 h-5 text-green-600" /> :
                            <ArrowUpRight className="w-5 h-5 text-red-600" />
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">
                            {transaction.description || `${transaction.type} Transaction`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()} • {transaction.gateway}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                        </p>
                        <Badge 
                          variant={transaction.status === 'SUCCESS' ? 'default' : 
                                  transaction.status === 'PENDING' ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon, 
  title, 
  value, 
  change, 
  positive 
}: { 
  icon: React.ReactNode
  title: string
  value: string
  change: string
  positive: boolean
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
              <p className={`text-sm mt-1 flex items-center ${
                positive ? 'text-green-600' : 'text-red-600'
              }`}>
                {positive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                {change}
              </p>
            </div>
            <div className="opacity-60">
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
