import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { inject } from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import { TokenPayload } from '../interfaces/token.interface';


export const superAdminGuard: CanActivateFn = (route, state) => {

  const router = inject(Router)
  const userService = inject(UserService);

  const jwtToken = localStorage.getItem("jwtToken");

  let decoded: TokenPayload;

  if(jwtToken) {
    decoded = jwtDecode(jwtToken)

    if(decoded.role !== 'superadmin') {
      router.navigate(['/agenda'])
    }
  }


  return true;
};
