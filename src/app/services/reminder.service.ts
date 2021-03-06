import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Subject, Observable } from 'rxjs';
import { Reminder } from 'src/app/models/reminder.entity';

import { map } from 'rxjs/operators';

import { baseUrl } from 'src/environments/environment';
import { Router } from '@angular/router';

import DateUtil from 'src/app/services/dateutil.service';
import { SessionHandler } from 'src/app/services/auth/account/account.service';
import { AlertUtilService } from './alertutil.service';

@Injectable({
  providedIn: 'root',
})
export class ReminderService {
  private reminders: Array<Reminder> = [];

  constructor(
    private httpClient: HttpClient,
    private router: Router,
    private alertUtil: AlertUtilService,
  ){}

  private remindersUpdatedList = new Subject<Reminder[]>();

  getReminders(): void {
    this.httpClient.get<Reminder[]>(
      `${baseUrl}/reminders`,
      { headers: { 'User-ID': String(SessionHandler.getTokenFromStorage().userId) } }
    )
      .pipe(map(reminders => reminders.map(reminder => {
        return {
          id: reminder.id, ...reminder,
        };
      })
      ))
      .subscribe(reminders => {
        this.reminders = reminders;
        this.remindersUpdatedList.next([...this.reminders]);
      });

  }

  async getReminder(id: number): Promise<Reminder> {

    const reminder = await this.httpClient.get<Reminder>(`${baseUrl}/reminders/${id}`).toPromise();

    const parsedReminder: Reminder = {
      ...reminder,
      deadline: DateUtil.toDateISOString(reminder.deadline),
      createdAt: DateUtil.toDateISOString(reminder.createdAt),
    };

    return parsedReminder;

  }

  addReminder(title: string, deadline: string, body: string): void {

    const reminder: Reminder = {
      userId: SessionHandler.getTokenFromStorage().userId,
      title,
      deadline: DateUtil.toMilliseconds(deadline),
      body,
     };

    this.httpClient.post<Reminder>(
      `${baseUrl}/reminders`,
      reminder
    )
      .subscribe(postedReminder => {
        this.reminders.push(postedReminder);
        this.remindersUpdatedList.next([...this.reminders]);
        this.alertUtil.showAlert('ToDo added successfully');
      });

  }

  removeReminder(id: number): void {

    this.httpClient.delete(`${baseUrl}/reminders/${id}`)
      .subscribe(() => {
        this.reminders = this.reminders.filter((rem) => {
          return rem.id !== id;
        });
        this.remindersUpdatedList.next([...this.reminders]);
        this.alertUtil.showAlert('ToDo removed successfully');
      });
    this.router.navigate(['/home']);

  }

  updateReminder(id: number, title: string, deadline: string, body: string): void {

    const reminder: Reminder = {
      id,
      userId: SessionHandler.getTokenFromStorage().userId,
      title,
      deadline: DateUtil.toMilliseconds(deadline),
      body,
     };

    this.httpClient.put<Reminder>(
      `${baseUrl}/reminders/${id}`,
      reminder
    ).subscribe(updatedReminder => {
      const index = this.reminders.findIndex(oldReminder => oldReminder.id === updatedReminder.id);

      this.reminders[index] = updatedReminder;

      this.remindersUpdatedList.next([...this.reminders]);
      this.alertUtil.showAlert('ToDo updated successfully');
    });
    this.router.navigate(['/home']);
  }

  getReminderListObservable(): Observable<Reminder[]> {
    return this.remindersUpdatedList.asObservable();
  }

}
