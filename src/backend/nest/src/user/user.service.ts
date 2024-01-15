import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  NotImplementedException,
} from '@nestjs/common';
import { ChatType, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from '../utils';
import { UserDto } from './dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  private readonly logger = new Logger('UserService');

  async getUsers() {
    return await this.prisma.user.findMany();
  }

  async getUserById(userId: string) {
    try {
      return await this.prisma.user.findUnique({ where: { id: userId } });
    } catch (error) {
      this.logger.error(error);
      throw new Error(`Failed to return user with id ${userId}`);
    }
  }

  async getUserByLogin(userLogin: string) {
    return await this.prisma.user.findUnique({ where: { login: userLogin } });
  }

  async updateUserById(userId: string, userData: Partial<UserDto>): Promise<UserDto | null> {
  // Filter out the empty values from userData
  const nonEmptyData: Record<string, any> = {};
  Object.entries(userData).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      nonEmptyData[key] = value;
    }
  });

  if (Object.keys(nonEmptyData).length === 0) {
    // If there are no non-empty values, return null or handle accordingly
    return null;
  }
    return await this.prisma.user.update({
      where: { id: userId },
      data: nonEmptyData,
    });
  }

  async getAll(): Promise<UserDto[] | null> {
    return this.prisma.user.findMany();
  }

  async create(user: UserDto) {
    return await this.prisma.user.create({
      data: user,
    });
    //return user?.friends || null;
  }

  async getFriendRequests(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { 
        receivedFriendRequests: {
          where: {
            type: "PENDING",
          },
          include: { requestor: true },
        },
      },
    });
  
    return user?.receivedFriendRequests;
  }

  async getNotFriends(userId: string): Promise<UserDto[] | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        friends: true,
        receivedFriendRequests: {
          where: {
            type: 'PENDING',
          },
          select: {
            requestor: true, // Include the related user data
          },
        },
        sentFriendRequests: {
          where: {
            type: 'PENDING',
          },
          select: {
            requestee: true, // Include the related user data
          },
        },
      },
    });
  
    const friendsIds = user?.friends.map((friend) => friend.id) || [];
    const receivedFriendRequestsIds = user?.receivedFriendRequests.map((request) => request.requestor.id) || [];
    const sentFriendRequestsIds = user?.sentFriendRequests.map((request) => request.requestee.id) || [];
  
    const excludeUserIds = [...friendsIds, ...receivedFriendRequestsIds, ...sentFriendRequestsIds, userId];
  
    // Fetch users who are not friends and don't have pending friend requests
    const notFriends = await this.prisma.user.findMany({
      where: {
        NOT: {
          id: { in: excludeUserIds },
        },
      },
    });
  
    return notFriends || null;
  }
  

  async addFriendRequest(requesterId: string, requesteeId: string): Promise<{ message: string; friendRequest?: any }> {
    try {
      // Check if both users exist
      const requestor = await this.prisma.user.findUnique({
        where: { id: requesterId },
      });
  
      const requestee = await this.prisma.user.findUnique({
        where: { id: requesteeId },
      });
  
      if (!requestor || !requestee) {
        return { message: 'User not found' };
      }
  

      const friends = await this.getFriends(requesterId);

      // Check if the requestee is already a friend
      if (friends.some((friend) => friend.id === requesteeId)) {
       return { message: 'Requestee is already a friend' };
      }

      // Check if a friend request already exists
      const existingFriendRequest = await this.prisma.friendRequest.findFirst({
        where: {
          requesterId,
          requesteeId,
          type: 'PENDING', // You might want to include the type in the check
        },
      });
  
      if (existingFriendRequest) {
        return { message: 'Friend request already exists' };
      }
  
      // Create the friend request
      const friendRequest = await this.prisma.friendRequest.create({
        data: {
          type: 'PENDING',
          requestor: { connect: { id: requesterId } },
          requestee: { connect: { id: requesteeId } },
        },
      });
  
      return { message: 'Friend request created', friendRequest };
    } catch (error) {
      throw new Error('Error creating friend request');
    }
  }

  async handleFriendRequest(requesterId: string, requesteeId: string, id: string, type: string) {
    try {
      if (type === "ACCEPTED")
      {
        const friendRequest = await this.prisma.friendRequest.update({
          where: {
            id: id,
          },
          data: {
            type: 'ACCEPTED',
          },
        });
  
        await this.prisma.user.update({
          where: {
            id: requesteeId,
          },
          data: {
            friends: {
              connect: { id: requesterId }
            },
          },
        });
        return { message: 'Friend request accepted', friendRequest };
      }
      else
      {
        const friendRequest = await this.prisma.friendRequest.update({
          where: {
            id: id,
          },
          data: {
            type: 'CANCELED',
          },
        });
  
        return { message: 'Friend request denied', friendRequest };
      }
  
    } catch (error) {
      throw new Error('Error accepting friend request');
    }
  }

  async blockUser(id: string, blockedId: string) {
    try {

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: blockedId,
      },
    });

    if (!existingUser) {
      return { message: 'User with blockedId not found:', blockedId };
    }

    const isAlreadyBlocked = await this.prisma.user.findFirst({
      where: {
        id: blockedId,
        blockedBy: {
          some: {
            id: id,
          },
        },
      },
    });

    if (isAlreadyBlocked) {
      return { message: 'User is already blocked:', blockedId };
    }

    await this.prisma.user.update({
      where: {
        id: blockedId,
      },
      data: {
        blockedBy: {
          connect: { id: id },
        },
      },
    });
   
    } catch (error) {
      throw new Error('Error blocking user');
    }
  }
  
  async set2FASecret(id: string, secret: string) {
    try {
      return await this.prisma.user.update({
        where: { id: id },
        data: { twoFactorAuthSecret: secret },
      });
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async set2FAOn(id: string) {
    return await this.prisma.user.update({
      where: { id: id },
      data: { twoFactorAuthEnabled: true },
    });
  }

  async set2FAOff(id: string) {
    return await this.prisma.user.update({
      where: { id: id },
      data: {
        twoFactorAuthEnabled: false,
      },
    });
  }

  async is2FAEnabled(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: id } });
    if (!user) {
      throw new NotFoundException('User does not exist');
    }
    return user.twoFactorAuthEnabled;
  }

  async getBlockableUsers(id: string) {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          id: {
            not: id,
          },
          blockedBy: {
            none: {
              id: id,
            },
          },
        },
      });
  
      return users;
    } catch (error) {
      throw new Error('Error fetching users');
    }
  }

  async getFriends(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        friends: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Could not find user ith id', userId);
    }
    return user.friends;
  }

  async getChatRooms(userId: string) {
    const userWithChatRooms = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        chatRooms: {
          include: {
            participants: true,
          },
        },
      },
    });

    if (userWithChatRooms) {
      const modifiedRooms = userWithChatRooms.chatRooms.map((room) => {
        if (room.type === ('DIRECT_MESSAGE' as ChatType)) {
          //Find the other user in the direct message room
          const directUser = room.participants.find(
            (user) => user.id !== userId,
          );

          return {
            ...room,
            name: directUser.login || 'User',
            image:
              directUser.image ||
              'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiJuFZF4sFjZGf3JtXkRDHrtQXNjx3QSRI_NqN2pbWiCXddEPYQ89a0MH91XEp6IwICW8&usqp=CAU',
          };
        }

        // Return other room types unchanged
        return room;
      });

      return modifiedRooms;
    }
    return null; // or handle the case when userWithChatRooms is null
  }

  async getChatRoomById(chatId: string) {
    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        participants: true,
        admins: true,
        owner: true,
      },
    });

    if (chatRoom) {
      return chatRoom;
    }
    return null;
  }

  async updateChatRoomPrivacy(
    chatId: string,
    newType: ChatType,
    newPassword: string,
  ) {
    await this.prisma.chatRoom.update({
      where: { id: chatId },
      data: {
        type: newType,
        password: newPassword,
      },
    });
    return null;
  }

  async getChatRoomsByLogin(username: string) {
    return await this.prisma.user.findUnique({
      where: { login: username },
      include: {
        chatRooms: true,
      },
    });
  }

  async getChatHistory(userId: string, chatId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        chatRooms: {
          where: { id: chatId },
          include: {
            messages: {
              include: {
                sender: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      this.logger.error('No such user: ', userId, chatId);
      throw new NotFoundException('User not found');
    }
    // Extract messages from the chat room
    const messages = user?.chatRooms[0]?.messages || [];

    return messages;
  }

  async insertFriend(userId: string, friend: any) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: { friends: { connect: { id: friend } } },
    });
  }

  async createRoom(userId: string, roomData: any) {
    const hashedPassword = await bcrypt.hashPassword(roomData.password);
    return await this.prisma.chatRoom.create({
      data: {
        id: roomData.id,
        name: roomData.name,
        userId: userId,
        image: roomData.image,
        type: roomData.type,
        password: hashedPassword,
        participants: {
          connect: roomData.participants.map((login: string) => ({
            login: login,
          })),
        },
      },
    });
  }

  async leaveRoom(login: string, roomId: string) {
    try {
      const updatedUser = await this.prisma.user.update({
        where: { login: login },
        data: { chatRooms: { disconnect: { id: roomId } } },
      });

      if (!updatedUser) {
        // User not found or update failed
        return { success: false, message: 'Failed to leave the chat room' };
      }

      // Check if the chat room becomes empty after the user leaves
      const chatRoom = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: { participants: true },
      });

      if (chatRoom?.participants.length === 0) {
        // If the chat room is empty, delete it
        await this.prisma.chatRoom.delete({
          where: { id: roomId },
        });
      }

      return { success: true, message: 'User successfully left the chat room' };
    } catch (error) {
      this.logger.error('Error leaving room:', error.message || error);
      return {
        success: false,
        message: 'Internal server error',
        error: error.message,
      };
    }
  }

  async joinRoom(
    login: string,
    roomId: string,
    password: string,
    roomType: string,
  ) {
    try {
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
      });

      const passToComp = await bcrypt.validatePassword(password, room.password);
      if (roomType === 'PROTECTED' && passToComp === false) {
        return {
          success: false,
          message: 'Incorrect password for the chat room',
        };
      }

      const updatedUser = await this.prisma.user.update({
        where: { login: login },
        data: { chatRooms: { connect: { id: roomId } } },
      });

      if (!updatedUser) {
        return { success: false, message: 'Failed to join the chat room' };
      }

      return {
        success: true,
        message: 'User successfully joined the chat room',
      };
    } catch (error) {
      this.logger.error('Error joining room:', error.message || error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getJoinableRooms(userId: string) {
    const rooms = await this.prisma.chatRoom.findMany({
      where: {
        type: { not: 'DIRECT_MESSAGE' as ChatType },
        participants: {
          none: {
            id: userId,
          },
        },
      },
    });
    if (!rooms) {
      this.logger.error('No rooms for user id: ', userId);
      throw new NotFoundException('Could not get joinable rooms');
    }
    return rooms;
  }

  async addMessage(userId: string, chatId: string, content: string) {
    try {
      // Check if the chat room exists
      const chatRoom = await this.prisma.chatRoom.findUnique({
        where: { id: chatId },
      });

      if (!chatRoom) {
        this.logger.error('Chat room not found.', {
          data: { user: userId, chat: chatId, content: content },
        });
        throw new NotFoundException('Chat room not found');
      }

      // Check if the sender user exists
      const sender = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!sender) {
        this.logger.error('Sender not found.', {
          data: { user: userId, chat: chatId, content: content },
        });
        throw new NotFoundException('Sender user not found');
      }

      // Create a new message
      const newMessage = await this.prisma.message.create({
        data: {
          content: content,
          chat_id: chatId,
          sender_id: userId,
          userId: userId,
        },
      });

      return newMessage;
    } catch (error) {
      this.logger.error('Error adding message:', error.message);
      throw new NotImplementedException(error.message);
    }
  }

  async addAdminToChat(login: string, chatId: string, userId: string) {
    // Check if the chat room and user exist

    const requester = await this.prisma.user.findUnique({
      where: { login: login },
    });

    const chatRoom = await this.prisma.chatRoom.findUnique({
      where: { id: chatId },
      include: {
        admins: true,
        owner: true,
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!chatRoom || !user || !requester) {
      throw new NotFoundException('Chat room or user not found.');
    }

    if (requester.id != chatRoom.owner.id) {
      throw new ForbiddenException('User is not the channel owner');
    }

    // Check if the user is already an admin
    const isAdmin = chatRoom.admins.some((admin) => admin.id === userId);

    if (isAdmin) {
      throw new ForbiddenException(
        'User is already an admin in this chat room.',
      );
    }

    // Add the user as an admin
    return await this.prisma.chatRoom.update({
      where: { id: chatId },
      data: {
        admins: {
          connect: { id: userId },
        },
      },
    });
  }

  async getChannelParticipants(channelId: string) {
    const channel = await this.getChatRoomById(channelId);

    if (!channel) {
      throw new NotFoundException('Could not get room: ', channelId);
    }

    const participants = channel.participants.filter((participant) => {
      const isAdmin = channel.admins.some(
        (admin) => admin.id === participant.id,
      );
      const isOwner = channel.owner.id === participant.id;

      // Include participants who are neither owner nor admin
      return !isAdmin && !isOwner;
    });
    return participants;
  }

  async isAdmin(userId: string, roomId: string) {
    const room = await this.getChatRoomById(roomId);
    if (!room) {
      throw new NotFoundException('No such room: ', roomId);
    }
    return room.admins.some((admin) => admin.id === userId);
  }

  async isOwner(userId: string, roomId: string) {
    const room = await this.getChatRoomById(roomId);
    if (!room) {
      throw new NotFoundException('No such room: ', roomId);
    }
    return room.owner.id === userId;
  }

  async kickUser(id: string, roomId: string) {
    return await this.prisma.chatRoom.update({
      where: { id: roomId },
      data: {
        participants: {
          disconnect: { id },
        },
        admins: {
          disconnect: { id },
        },
      },
      include: {
        participants: true,
      },
    });
  }

  async kickableUsers(user: User, roomId: string) {
    if (await this.isOwner(user.id, roomId)) {
      const room = await this.prisma.chatRoom.findUnique({
        where: { id: roomId },
        include: {
          participants: {
            where: { NOT: { id: user.id } },
          },
          admins: {
            where: { NOT: { id: user.id } },
          },
          owner: false,
        },
      });
      return room.participants;
    } else if (await this.isAdmin(user.id, roomId)) {
      return await this.getChannelParticipants(roomId);
    }
  }
}
