import { IsEnum, IsNotEmpty } from 'class-validator';
import { RouteStatus } from '../schemas/route.schema';

export class UpdateRouteStatusDto {
  @IsNotEmpty()
  @IsEnum(RouteStatus)
  status!: RouteStatus;
}
