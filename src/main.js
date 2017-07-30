import Rx from 'rxjs/Rx';

Rx.Observable.interval(1000)
    .take(4)
    .subscribe(data => console.log(data))
    ;


