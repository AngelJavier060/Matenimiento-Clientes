import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/** Compatibilidad: `/reminders/new` ya no existe; lleva la lista preservando query (p. ej. vehicleId). */
@Component({
  selector: 'app-reminder-new-redirect',
  template: ''
})
export class ReminderNewRedirectComponent implements OnInit {
  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParams;
    void this.router.navigate(['/reminders'], {
      replaceUrl: true,
      queryParams: Object.keys(qp).length ? qp : {}
    });
  }
}
