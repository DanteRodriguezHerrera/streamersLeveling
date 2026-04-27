import { HttpContextToken, HttpEvent, HttpHandlerFn, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

export const CACHING_ENABLED = new HttpContextToken<boolean>(() => true);

export function authorizationInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {

    if(req.context.get(CACHING_ENABLED)) {
        const token = localStorage.getItem('jwtToken');
        
        if(token) {    
            return next(req.clone({
                setHeaders: {'authorization': `Bearer ${token}`}
            }))
        }
    }
    else {
        return next(req);
    }

    return next(req);

}