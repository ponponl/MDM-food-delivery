import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  AlertCircle,
  Loader,
} from 'lucide-react';
import styles from './MerchantReportPage.module.css';
import { useAuth } from '../../context/AuthContext';
import orderApi from '../../api/orderApi';

const MerchantReportPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeFrame, setTimeFrame] = useState('week'); // 'week' or 'month'

  const restaurantId = user?.restaurantId || user?.restaurant_id || user?.id || user?.restaurant_public_id;

  useEffect(() => {
    if (!restaurantId) {
      console.log('⚠️ No restaurantId, skipping API call');
      return;
    }

    const fetchRevenueStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const todayDate = new Date();
        const timePartitionDay = todayDate.toISOString().split('T')[0].substring(0, 10);
        
        const dayResponse = await orderApi.getRevenueStats({
          restaurantId: restaurantId,
          granularity: 'DAY',
          timePartition: timePartitionDay
        });

        const monthDate = new Date();
        const timePartitionMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        
        const monthResponse = await orderApi.getRevenueStats({
          restaurantId: restaurantId,
          granularity: 'MONTH',
          timePartition: timePartitionMonth
        });

        const combinedData = [
          ...(dayResponse?.data?.data || []),
          ...(monthResponse?.data?.data || [])
        ];
        setData(combinedData);
      } catch (err) {
        console.error('Error fetching revenue stats:', err);
        setError(err?.response?.data?.message || 'Lỗi khi tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchRevenueStats();
  }, [restaurantId]);
  const formatVND = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  // Lấy ngày hiện tại
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Tính toán KPIs
  const todayRevenue = useMemo(() => {
    const todayString = today.toISOString().split('T')[0];
    return data
      .filter((item) => item.granularity === 'DAY' && item.time_value === todayString)
      .reduce((sum, item) => sum + (item.total_revenue || 0), 0);
  }, [data, today]);

  const monthOrders = useMemo(() => {
    return data
      .filter(
        (item) =>
          item.granularity === 'MONTH' &&
          new Date(item.time_value).getMonth() === currentMonth &&
          new Date(item.time_value).getFullYear() === currentYear
      )
      .reduce((sum, item) => sum + (item.total_orders || 0), 0);
  }, [data, currentMonth, currentYear]);

  const revenueGrowth = useMemo(() => {
    const currentMonthRevenue = data
      .filter(
        (item) =>
          item.granularity === 'MONTH' &&
          new Date(item.time_value).getMonth() === currentMonth &&
          new Date(item.time_value).getFullYear() === currentYear
      )
      .reduce((sum, item) => sum + (item.total_revenue || 0), 0);

    const lastMonthDate = new Date(currentYear, currentMonth - 1);
    const lastMonthRevenue = data
      .filter(
        (item) =>
          item.granularity === 'MONTH' &&
          new Date(item.time_value).getMonth() === lastMonthDate.getMonth() &&
          new Date(item.time_value).getFullYear() === lastMonthDate.getFullYear()
      )
      .reduce((sum, item) => sum + (item.total_revenue || 0), 0);

    if (lastMonthRevenue === 0) return 0;
    return (((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100).toFixed(1);
  }, [data, currentMonth, currentYear]);

  // Dữ liệu cho chart dựa trên timeFrame
  const chartData = useMemo(() => {
    let filteredData = [];

    if (timeFrame === 'week') {
      // 7 ngày gần nhất
      filteredData = data.filter((item) => item.granularity === 'DAY').slice(-7);
    } else {
      // 6 tháng gần nhất
      filteredData = data.filter((item) => item.granularity === 'MONTH').slice(-6);
    }

    return filteredData.map((item) => ({
      ...item,
      displayDate: formatDate(item.time_value),
      displayRevenue: item.total_revenue,
    }));
  }, [data, timeFrame]);

  // Dữ liệu bảng - lấy dữ liệu DAY mới nhất
  const tableData = useMemo(() => {
    return data
      .filter((item) => item.granularity === 'DAY')
      .sort((a, b) => new Date(b.time_value) - new Date(a.time_value))
      .slice(0, 10);
  }, [data]);

  // KPI Card Component
  const KPICard = ({ icon: Icon, title, value, subtitle, bgColor }) => (
    <div className={`${styles.kpiCard} ${bgColor}`}>
      <div className={styles.kpiContent}>
        <div className={styles.kpiText}>
          <p className={styles.kpiTitle}>{title}</p>
          <p className={styles.kpiValue}>{value}</p>
          {subtitle && <p className={styles.kpiSubtitle}>{subtitle}</p>}
        </div>
        <Icon className={styles.kpiIcon} size={48} />
      </div>
    </div>
  );

  // Custom Tooltip cho Chart
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>
            {payload[0].payload.displayDate}
          </p>
          <p className={styles.tooltipValue}>
            {formatVND(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Thống Kê Doanh Thu</h1>
          <p className={styles.subtitle}>
            {user?.restaurantName ? `Nhà hàng: ${user.restaurantName}` : user?.name || 'Theo dõi hiệu suất kinh doanh của bạn'}
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className={styles.errorBox}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State - Auth Loading */}
        {authLoading ? (
          <div className={styles.loadingBox}>
            <Loader size={32} className={styles.spinner} />
            <p>Đang xác thực...</p>
          </div>
        ) : !restaurantId ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} />
            <p>Không tìm thấy thông tin nhà hàng. Vui lòng đăng nhập lại.</p>
            <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '8px' }}>
              Debug: user = {user ? JSON.stringify(user).substring(0, 100) : 'null'}
            </p>
          </div>
        ) : loading ? (
          <div className={styles.loadingBox}>
            <Loader size={32} className={styles.spinner} />
            <p>Đang tải dữ liệu thống kê...</p>
          </div>
        ) : (
          <>
            {/* KPI Cards - Top Row */}
            <div className={styles.kpiGrid}>
              <KPICard
                icon={DollarSign}
                title="Doanh Thu Hôm Nay"
                value={formatVND(todayRevenue)}
                bgColor={styles.bgOrange}
              />
              <KPICard
                icon={ShoppingCart}
                title="Đơn Hàng Tháng Này"
                value={monthOrders.toLocaleString('vi-VN')}
                subtitle="đơn hàng"
                bgColor={styles.bgGreen}
              />
              <KPICard
                icon={TrendingUp}
                title="Tăng Trưởng Doanh Thu"
                value={`${revenueGrowth}%`}
                subtitle="so với tháng trước"
                bgColor={revenueGrowth >= 0 ? styles.bgBlue : styles.bgRed}
              />
            </div>

            {/* Chart Section - Middle Row */}
            <div className={styles.chartSection}>
              <div className={styles.chartHeader}>
                <h2 className={styles.chartTitle}>Biến Động Doanh Thu</h2>
                <div className={styles.buttonGroup}>
                  <button
                    onClick={() => setTimeFrame('week')}
                    className={`${styles.toggleBtn} ${
                      timeFrame === 'week' ? styles.toggleBtnActive : ''
                    }`}
                  >
                    7 Ngày
                  </button>
                  <button
                    onClick={() => setTimeFrame('month')}
                    className={`${styles.toggleBtn} ${
                      timeFrame === 'month' ? styles.toggleBtnActive : ''
                    }`}
                  >
                    6 Tháng
                  </button>
                </div>
              </div>

              {chartData.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="displayDate"
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        style={{ fontSize: '12px' }}
                        tickFormatter={(value) =>
                          `${(value / 1000000).toFixed(0)}M`
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="displayRevenue"
                        stroke="#f97316"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className={styles.emptyChart}>
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>

            {/* Table Section - Bottom Row */}
            <div className={styles.tableSection}>
              <div className={styles.tableHeader}>
                <h2 className={styles.tableTitle}>
                  <Calendar size={20} style={{ marginRight: '8px' }} />
                  Chi Tiết Doanh Thu Theo Ngày
                </h2>
              </div>

              {tableData.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr className={styles.tableHeadRow}>
                        <th className={styles.tableHeadCell}>Ngày</th>
                        <th className={styles.tableHeadCell}>Số Đơn Hàng</th>
                        <th className={`${styles.tableHeadCell} ${styles.textRight}`}>
                          Doanh Thu
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, index) => (
                        <tr
                          key={index}
                          className={`${styles.tableBodyRow} ${
                            index % 2 === 0
                              ? styles.tableRowEven
                              : styles.tableRowOdd
                          }`}
                        >
                          <td className={styles.tableCell}>
                            {formatDate(row.time_value)}
                          </td>
                          <td className={styles.tableCell}>
                            {row.total_orders?.toLocaleString('vi-VN') || 0}
                          </td>
                          <td
                            className={`${styles.tableCell} ${styles.textRight} ${styles.textOrange}`}
                          >
                            {formatVND(row.total_revenue || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyTable}>
                  Không có dữ liệu để hiển thị
                </div>
              )}
            </div>
            </>
        )}
      </div>
    </div>
  );
};

export default MerchantReportPage;
