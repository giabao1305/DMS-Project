import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Server, Socket } from 'socket.io';

import type { JwtPayload } from '../auth/jwt.strategy';
import { User, UserDocument } from '../users/schemas/user.schema';

type SocketUser = {
  id: string;
  role: string;
};

type SocketData = {
  user?: SocketUser;
};

type SocketAuth = {
  token?: unknown;
};

@WebSocketGateway({
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN?.split(',') ?? [
      'http://localhost:3000',
      'http://localhost:8082',
    ],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly jwtService: JwtService,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  @WebSocketServer()
  server!: Server;

  async handleConnection(client: Socket) {
    const token = this.extractToken(client);

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.isActive) {
        client.disconnect(true);
        return;
      }

      this.getSocketData(client).user = {
        id: user._id.toString(),
        role: user.role,
      };

      await client.join(`user:${user._id.toString()}`);
      await client.join(`role:${user.role}`);

      console.log('Socket connected:', client.id);
    } catch {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    console.log('Socket disconnected:', client.id);
  }

  @SubscribeMessage('join-user')
  async joinUser(@ConnectedSocket() client: Socket) {
    const userId = this.getSocketData(client).user?.id;

    if (!userId) {
      return {
        success: false,
      };
    }

    await client.join(`user:${userId}`);

    return {
      success: true,
      room: `user:${userId}`,
    };
  }

  @SubscribeMessage('join-role')
  async joinRole(@ConnectedSocket() client: Socket) {
    const role = this.getSocketData(client).user?.role;

    if (!role) {
      return {
        success: false,
      };
    }

    await client.join(`role:${role}`);

    return {
      success: true,
      room: `role:${role}`,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken = this.getSocketAuth(client).token;

    if (typeof authToken === 'string' && authToken) {
      return authToken;
    }

    const authorization = client.handshake.headers.authorization;

    if (typeof authorization === 'string') {
      const [type, token] = authorization.split(' ');

      if (type === 'Bearer' && token) {
        return token;
      }
    }

    return null;
  }

  private getSocketData(client: Socket): SocketData {
    return client.data as SocketData;
  }

  private getSocketAuth(client: Socket): SocketAuth {
    return client.handshake.auth;
  }

  emitToUser(userId: string, event: string, data: unknown) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  emitToRole(role: string, event: string, data: unknown) {
    this.server.to(`role:${role}`).emit(event, data);
  }

  emitToAll(event: string, data: unknown) {
    this.server.emit(event, data);
  }
}
