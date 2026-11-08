import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Brand } from '../../../shared/brand/brand';

@Component({
  selector: 'app-auth-shell',
  imports: [Brand],
  templateUrl: './auth-shell.html',
  styleUrl: './auth-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthShell {
  protected readonly rows = Array.from({ length: 16 }, (_, i) => i);
}