const moment = require('moment');
const Order = require('../models/Order');
const errorHandlers = require('../util/errorHandlers');

const getOrdersMap = (orders = []) => {
    const daysOrder = {};
    orders.forEach(order => {
        const date = moment(order.date).format('DD.MM.YYYY');

        if (date === moment().format('DD.MM.YYYY')) {
            return
        }

        if (!daysOrder[date]) {
            daysOrder[date] = []
        }

        daysOrder[date].push(order)
    });
    return daysOrder;
};

const calculatePrice = (orders = []) => {
    return orders.reduce((total, order) => {
        const orderPrice = order.list.reduce((orderTotal, item) => {
            return orderTotal += item.cost * item.quantity;
        }, 0);
        return total +=orderPrice
    }, 0)
};

module.exports.overview = async (req, res) => {
    try {
        const allOrders = await Order.find({user: req.user.id}).sort({date: 1});
        const ordersMap = getOrdersMap(allOrders);

        // вчерашние заказы
        const yesterdayOrders = ordersMap[moment().add(-1, 'd').format('DD.MM.YYYY')] || [];
        // кол-во заказов вчера
        const yesterdayOrdersNumber = yesterdayOrders.length;
        // кол-во заказов
        const totalOrdersNumber = allOrders.length;
        // кол-во дней
        const daysNumber = Object.keys(ordersMap).length;
        // кол-во заказов в день
        const ordersPerDay = (totalOrdersNumber / daysNumber).toFixed(0);
        // процент для кол-во заказов ((кол-во заказов вчера / кол-во заказов в день) -1 ) * 100
        const ordersPercent = (((yesterdayOrdersNumber / ordersPerDay) -1 ) * 100).toFixed(2);
        // общая выручка
        const totalGain = calculatePrice(allOrders);
        // выручка в день
        const gainPerDay = totalGain / daysNumber;
        // выручка за вчера
        const yesterdayGain = calculatePrice(yesterdayOrders);
        // процент выручки
        const gainPercent = (((yesterdayGain / gainPerDay) -1 ) * 100).toFixed(2);
        // сравнение выручки
        const compareGain = (yesterdayGain - gainPerDay).toFixed(2);
        // сравнение заказов
        const compareNumber = (yesterdayOrdersNumber - ordersPerDay).toFixed(2);
        console.log('выручка за вчера' + yesterdayGain);
        console.log('выручка в день' + gainPerDay);
        console.log('кол-во заказов вчера' + yesterdayOrdersNumber);
        console.log('заказов в день' + ordersPerDay);
        res.status(200).json({
            gain: {
                percent: Math.abs(+gainPercent),
                compare: Math.abs(+compareGain),
                yesterday: +yesterdayGain,
                isHigher: +gainPercent > 0
            },
            orders: {
                percent: Math.abs(+ordersPercent),
                compare: Math.abs(+compareNumber),
                yesterday: +yesterdayOrdersNumber,
                isHigher: +ordersPercent > 0
            }
        })

    } catch (e) {
        errorHandlers(res, e)
    }
};

module.exports.analytics = async (req, res) => {
    try {
        const allOrders = await Order.find({user: req.user.id}).sort({date: 1});
        const ordersMap = getOrdersMap(allOrders);

        const averageCheck = +(calculatePrice(allOrders) / Object.keys(ordersMap).length).toFixed(2);

        const chart = Object.keys(ordersMap).map(label => {
            const gain = calculatePrice(ordersMap[label]);
            const order = ordersMap[label].length;
            return {label, order, gain}
        });

        res.status(200).json({
            averageCheck, chart
        })
    } catch (e) {
        errorHandlers(res, e)
    }
};
