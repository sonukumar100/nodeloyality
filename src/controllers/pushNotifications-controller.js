import { asyncHandler } from "../utils/asyncHandler.js";
// import { asyncHandler } from '../../utils/asyncHandler.js';

export const pushNotification = asyncHandler(async (req, res) => {
    const { userId, title, body } = req.body;
  
    // try {
    //   // 1. Get the token from DB
    //   const [rows] = await db.execute(
    //     'SELECT expo_push_token FROM user_push_tokens WHERE user_id = ?',
    //     [userId]
    //   );
  
    //   if (rows.length === 0) {
    //     return res.status(404).json({ error: 'No Expo token found for this user.' });
    //   }
  
      const token = "ExponentPushToken[YizTI4Plggiux04wOWMSjz]"
  
      // 2. Construct notification payload
      const message = {
        to: token,
        sound: 'default',
        title:  '📢	 New Offer! 📦 Grab it ⏰',
        body: 'Dont miss out on this opportunity! 🎉 ',
        data: { userId: 18,
            image:'https://media.istockphoto.com/id/2161896294/photo/woman-smiling-and-expressing-gratitude-during-a-conversation.jpg?s=1024x1024&w=is&k=20&c=DaprAnPUQvv0AVn0NsnnpbJNLSGRDTA_zCHlQfN2NIY='
        },
    };
  
      // 3. Send to Expo push API
      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });
  
      const result = await response.json();
  
      // 4. Return result to client
      res.json(result);
    } 
    // catch (err) {
    //   console.error('Error sending notification:', err);
    //   res.status(500).json({ error: 'Failed to send notification' });
    // }
  );
  