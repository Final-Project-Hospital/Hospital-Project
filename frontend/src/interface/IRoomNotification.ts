import {RoomInterface} from "./IRoom"
import {NotificationInterface} from "./INotification"

export interface RoomNotificationInterface {
    ID?: number;
    Room?: RoomInterface;
    Notification?: NotificationInterface;
}