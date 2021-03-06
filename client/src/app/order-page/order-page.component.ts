import {AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {NavigationEnd, Router} from "@angular/router";
import {MaterialInstance, MaterialService} from "../shared/classes/material.service";
import {OrderService} from "./order.service";
import {Order, OrderPosition} from "../shared/interfaces";
import {OrdersService} from "../shared/services/orders.service";
import {Subscription} from "rxjs";
import {log} from "util";

@Component({
  selector: 'app-order-page',
  templateUrl: './order-page.component.html',
  styleUrls: ['./order-page.component.css'],
  providers: [OrderService]
})
export class OrderPageComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('modal', {static: false}) modalRef: ElementRef;
  modal: MaterialInstance;
  oSub: Subscription;
  isRoot: boolean;
  pending = false;

  constructor(private router: Router,
              private order: OrderService,
              private ordersService: OrdersService) { }

  ngOnInit() {
    this.isRoot = this.router.url === '/order';
    this.router.events.subscribe(event => {
      if (event instanceof  NavigationEnd) {
        this.isRoot = this.router.url === '/order';
      }
    })

    console.log(this.order.list)
  }

  ngOnDestroy() {
    this.modal.destroy();
    if (this.oSub) {
      this.oSub.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.modal = MaterialService.initModal(this.modalRef);
  }

  removePosition(orderPosition: OrderPosition) {
    this.order.remove(orderPosition);
    MaterialService.toast(`Позиция ${orderPosition.name} удалена.`);
  }

  openModal() {
    this.modal.open();
  }

  cancelModal() {
    this.modal.close();
  }

  submitModal() {
    this.pending = true;
    const order: Order = {
      list: this.order.list.map(item => {
        delete item._id;
        return item;
      })
    };

    this.oSub = this.ordersService.create(order).subscribe(
      newOrder => {
        MaterialService.toast(`Заказ №${newOrder.order} был добавлен.`);
        this.order.clear();
      },
      error => MaterialService.toast(error.error.message),
      () => {
        this.modal.close();
        this.pending = false;
      }
    )
  }

}
