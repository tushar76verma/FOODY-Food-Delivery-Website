import User from "./models/user.model.js"
import DeliveryAssignment from "./models/deliveryAssignment.model.js"
import Order from "./models/order.model.js"

export const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(socket.id)
    socket.on('identity', async ({ userId }) => {
      try {
        const user = await User.findByIdAndUpdate(userId, {
          socketId: socket.id, isOnline: true
        }, { new: true })
        if (user) {
          socket.join(`user:${userId}`)
        }
      } catch (error) {
        console.log(error)
      }
    })


    socket.on('updateLocation', async ({ latitude, longitude, userId }) => {
      try {
        const user = await User.findByIdAndUpdate(userId, {
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          isOnline: true,
          socketId: socket.id
        })

        if (user) {
          const assignments = await DeliveryAssignment.find({
            assignedTo: userId,
            status: "assigned"
          })

          for (const assignment of assignments) {
            const order = await Order.findById(assignment.order).select("user shopOrders")
            if (!order) {
              continue
            }

            const shopOrder = order.shopOrders.id(assignment.shopOrderId)
            const roomIds = [String(order.user)]

            if (shopOrder?.owner) {
              roomIds.push(String(shopOrder.owner))
            }

            roomIds.forEach((roomId) => {
              io.to(`user:${roomId}`).emit('updateDeliveryLocation', {
                deliveryBoyId: userId,
                latitude,
                longitude
              })
            })
          }
        }


      } catch (error) {
          console.log('updateDeliveryLocation error')
      }
    })




    socket.on('disconnect', async () => {
      try {

        await User.findOneAndUpdate({ socketId: socket.id }, {
          socketId: null,
          isOnline: false
        })
      } catch (error) {
        console.log(error)
      }

    })
  })
}
