
# Chat App API
API documentation for the Chat App, providing endpoints for user management, chat operations, group chat functionality, and friend search.

 ## Base URL
The base URL for all API endpoints is:

https://chatapp-d59m.onrender.com/api

## User Management
### Create User
POST /auth/register
Create a new user.

### Login
POST /auth/login
Login to the Chat App.

### Upload Picture
PUT /auth/upload
Upload a user's profile picture.

### Edit Bio
PUT /auth/editbio
Edit the bio information for a user.

### Delete Picture
PUT /auth/delete
Delete a user's profile picture.

### Send Friend Request
POST /auth/send-friend-request/{id}
Send a friend request to another user.

### View Friend Requests
GET /auth/view-friend-requests
View pending friend requests.

### Accept Friend Request
PUT /auth/accept-friend-request/{id}
Accept a friend request.

### Profile
GET /auth/profile
Get the profile of the authenticated user.

### Display Friend List
GET /auth/dispaly-friend-list
Display the list of friends for the authenticated user.

### Leave Group
PATCH /auth/leave-group/{groupId}
Leave a group.

## Chat Operations
### Get All Chat
GET /chat/get-all-chat
Get all chat messages.

### Get A Chat
GET /chat/get-a-chat/{chatId}
Get a specific chat.

### Upload Photo Or Video
PUT /chat/upload/{chatId}
Upload a photo or video to a chat.

## Group Chat
### Create Group
POST /group/create
Create a new group.

### Delete Group
DELETE /group/delete/{groupId}
Delete a group.

### Edit Bio
PUT /group/edit-bio/{groupId}
Edit the bio information for a group.

### Add Friends to Group
POST /group/{groupId}/users/{userId}
Add friends to a group.

### Delete Message on Group Chat
DELETE /group/{groupId}/message/{messageId}
Delete a message in a group chat.

### Send Pic or Vid in Grp Chat
PUT /group/message/upload/{groupId}
Send a photo or video in a group chat.

### Get All Groups for User
GET /group/get-all-group
Get all groups for the authenticated user.

## Search
### Search Friends
GET /search
Search for friends by username.

Security
This API uses token-based authentication. Include the authentication token in the Authorization header as Bearer <token> for secured endpoints.

Contributing
If you would like to contribute to the development of this API or report any issues, please create a pull request or submit an issue on the GitHub repository. Contributions are welcome!
