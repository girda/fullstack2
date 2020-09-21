import {AfterViewInit, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {PositionsService} from "../../../shared/services/positions.service";
import {Position} from "../../../shared/interfaces";
import {MaterialInstance, MaterialService} from "../../../shared/classes/material.service";
import {FormGroup, FormControl, Validators} from "@angular/forms";
import {error} from "util";

@Component({
  selector: 'app-positions-form',
  templateUrl: './positions-form.component.html',
  styleUrls: ['./positions-form.component.css']
})
export class PositionsFormComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input('categoryId') categoryId: string;
  @ViewChild('modal', {static: false}) modalRef: ElementRef;

  positions: Position[] = [];
  loading = false;
  positionId = null;
  modal: MaterialInstance;
  form: FormGroup;

  constructor(private positionService: PositionsService) { }

  ngOnInit() {
    this.form = new FormGroup({
      name: new FormControl(null, Validators.required),
      cost: new FormControl(null, [Validators.required, Validators.min(1)]),
    });

    this.loading = true;
    this.positionService.fetch(this.categoryId).subscribe(
      positions => {
      this.positions = positions;
      this.loading = false;
      },
      error => {
        console.log(error)
      }
    )
  }

  ngOnDestroy() {
    this.modal.destroy();
  }

  ngAfterViewInit() {
    this.modal = MaterialService.initModal(this.modalRef)
  }

  onSelectPosition(position: Position) {
    this.positionId = position._id;
    this.form.patchValue({
      name: position.name,
      cost: position.cost
    });
    this.modal.open();

    MaterialService.updateTextInputs()
  }

  onAddPosition() {
    this.positionId = null;
    this.form.reset({
      name: null,
      cost: null
    });
    this.modal.open();

    MaterialService.updateTextInputs()
  }

  onDeletePosition(event: Event, position: Position) {
    event.stopPropagation();
    const decision = confirm(`Удалить позицию "${position.name}"?`);

    if (decision) {
      this.positionService.delete(position).subscribe(
        response => {
          const index = this.positions.findIndex(p => p._id === position._id)
          this.positions.splice(index, 1);
          MaterialService.toast(response.message);
        },
        error => MaterialService.toast(error.error.message)
      )
    }
  }

  onCancel() {
    this.modal.close()
  }

  onSubmit() {
    this.form.disable();

    const newPosition: Position = {
      name: this.form.value.name,
      cost: this.form.value.cost,
      category: this.categoryId
    };

    const completed = () => {
      this.modal.close();
      this.form.reset({name: '', cost: ''});
      this.form.enable();
    };

    if (this.positionId) {
      newPosition._id = this.positionId;
      this.positionService.update(newPosition).subscribe(
        position => {
          const index = this.positions.findIndex(p => p._id === position._id);
          this.positions[index] = position;
          MaterialService.toast('Изменения сохранены');
        },
        error =>  MaterialService.toast(error.error.message),
        completed
      )
    } else {
      this.positionService.create(newPosition).subscribe(
        position => {
          MaterialService.toast('Позиция создана');
          this.positions.push(position);
        },
        error =>  MaterialService.toast(error.error.message),
        completed
      )
    }


  }
}
