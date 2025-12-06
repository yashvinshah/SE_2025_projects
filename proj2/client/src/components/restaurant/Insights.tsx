import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import './Insights.css';

interface Order {
    id: string;
    totalAmount: number;
    status: string;
    createdAt: string;
}

const Insights: React.FC = () => {
    const { user } = useAuth();

    const { data: orders = [], isLoading } = useQuery<Order[]>({
        queryKey: ['restaurantOrders', user?.id],
        queryFn: async () => {
            const response = await api.get(`/orders/restaurant?restaurantId=${user?.id}`);
            return response.data.orders;
        },
        enabled: !!user
    });

    const metrics = useMemo(() => {
        if (!orders.length) return null;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // 1. Daily Revenue and Orders Fulfilled (for Today)
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= today && orderDate < new Date(today.getTime() + 86400000);
        });

        const dailyDeliveredOrders = todayOrders.filter(order => order.status === 'delivered');
        const dailyRevenue = dailyDeliveredOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const dailyOrdersCount = dailyDeliveredOrders.length;

        // 2. Monthly AOV and Percentage Change
        const getMonthStats = (month: number, year: number) => {
            const monthOrders = orders.filter(order => {
                const d = new Date(order.createdAt);
                return d.getMonth() === month && d.getFullYear() === year && order.status === 'delivered';
            });

            const totalRev = monthOrders.reduce((sum, order) => sum + order.totalAmount, 0);
            return {
                count: monthOrders.length,
                revenue: totalRev,
                aov: monthOrders.length ? totalRev / monthOrders.length : 0
            };
        };

        const currentMonthStats = getMonthStats(currentMonth, currentYear);
        const lastMonthStats = getMonthStats(lastMonth, lastMonthYear);

        const aovChange = lastMonthStats.aov === 0
            ? (currentMonthStats.aov > 0 ? 100 : 0)
            : ((currentMonthStats.aov - lastMonthStats.aov) / lastMonthStats.aov) * 100;

        // 3. Cancelled Orders Ratio
        const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
        const totalOrders = orders.length;
        const cancellationRatio = totalOrders ? (cancelledOrders / totalOrders) * 100 : 0;

        return {
            dailyRevenue,
            dailyOrdersCount,
            currentMonthAOV: currentMonthStats.aov,
            aovChange,
            cancelledOrders,
            totalOrders,
            cancellationRatio
        };
    }, [orders]);

    if (isLoading) return <div>Loading insights...</div>;
    if (!metrics) return <div>No data available for insights.</div>;

    const getTrendClass = (value: number) => {
        if (value > 0) return 'trend-positive';
        if (value < 0) return 'trend-negative';
        return 'trend-neutral';
    };

    const getTrendIcon = (value: number) => {
        if (value > 0) return '↑';
        if (value < 0) return '↓';
        return '•';
    };

    return (
        <div className="insights-container">
            <div className="insights-header">
                <h2>Dashboard Insights</h2>
                <p>Overview of your restaurant's performance</p>
            </div>

            <div className="insights-cards">
                {/* Card 1: Daily Revenue & Orders */}
                <div className="insight-card">
                    <div className="card-title">Today's Performance</div>
                    <div className="card-value">${metrics.dailyRevenue.toFixed(2)}</div>
                    <div className="card-subtext">
                        {metrics.dailyOrdersCount} orders fulfilled today
                    </div>
                </div>

                {/* Card 2: Monthly AOV */}
                <div className="insight-card">
                    <div className="card-title">Monthly Average Order Value</div>
                    <div className="card-value">${metrics.currentMonthAOV.toFixed(2)}</div>
                    <div className="card-subtext">
                        <span className={`trend-indicator ${getTrendClass(metrics.aovChange)}`}>
                            {getTrendIcon(metrics.aovChange)} {Math.abs(metrics.aovChange).toFixed(1)}%
                        </span>
                        <span> vs last month</span>
                    </div>
                </div>

                {/* Card 3: Cancellation Ratio */}
                <div className="insight-card">
                    <div className="card-title">Cancellation Rate</div>
                    <div className="card-value">{metrics.cancellationRatio.toFixed(1)}%</div>
                    <div className="card-subtext">
                        {metrics.cancelledOrders} cancelled / {metrics.totalOrders} total
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Insights;
