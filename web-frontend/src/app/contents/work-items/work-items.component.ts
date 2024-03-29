import {AfterViewInit, Component, OnInit, signal, ViewChild} from '@angular/core';
import {DataStoreService} from "../../common/api/data-store.service";
import {WorkItem} from "../../common/model/workitems";
import {MatTableDataSource, MatTableModule} from "@angular/material/table";
import {MatExpansionModule} from "@angular/material/expansion";
import {MatPaginator, MatPaginatorModule} from "@angular/material/paginator";
import {MatFormFieldModule} from "@angular/material/form-field";
import {MatInputModule} from "@angular/material/input";
import {MetaDataService} from "../../common/api/meta-data.service";
import {Field, FieldValue} from "../../common/model/field";
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragRelease,
  CdkDropList, CdkDropListGroup,
} from '@angular/cdk/drag-drop';
import {MatListModule, MatSelectionList} from "@angular/material/list";
import {MatProgressSpinnerModule} from "@angular/material/progress-spinner";
import {MatCheckboxModule} from "@angular/material/checkbox";
import {MatSelectModule} from "@angular/material/select";
import {FormControl, ReactiveFormsModule} from "@angular/forms";
import {MatOptionSelectionChange} from "@angular/material/core";
import {Process} from "../../common/model/process";


export interface FieldViewModel {
  isVisible: boolean;
  isSelected: boolean;
  name: string;
  referenceName: string;
  description: string;
}

interface ProcessField {
  ReferenceId: string;
  LabelText: string;
}

interface ProcessInfo {
  name: string;
  fields: ProcessField[]
}

interface DisplayColumn {
  id: string,
  label: string,
  isVisible: boolean,
  displayOrder: number
}

interface DynamicObject {
  [prop: string]: any;
}

@Component({
  selector: 'app-work-items',
  standalone: true,
  imports: [
    MatTableModule,
    MatExpansionModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    CdkDropList,
    CdkDrag,
    CdkDropListGroup,
    MatListModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './work-items.component.html',
  styleUrl: './work-items.component.scss'
})
export class WorkItemsComponent implements AfterViewInit, OnInit {

  public isLoading: boolean = true;

  // 表示できるカラム
  public displayColumns: DisplayColumn[] = [];

  // 表示するカラム
  public displayedColumns: string[] = [
    "id",
    "rev",
  ];

  public dragDisplayColumn: DisplayColumn | undefined;

  // Raw MetaData
  public fields: FieldValue[] = [];

  public selectedFields: FieldViewModel[] = [];

  public processInfos: ProcessInfo[] = [];


  public values: DynamicObject[] = [];

  public processesFormControl = new FormControl('');

  public dataSource = new MatTableDataSource<DynamicObject>(this.values);

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  @ViewChild('selectedFileds')
  public selectedFileds: MatSelectionList | undefined;


  private selectedProcessInfos: Map<string, ProcessInfo> = new Map<string, ProcessInfo>()

  constructor(private readonly dataStoreService: DataStoreService, private readonly metaDataService: MetaDataService) {

    // this.dataSource.filterPredicate = (data: WorkItem, filter: string) => {
    //   // dataはフィルタリングされる行、filterはフィルター条件
    //   // ここで動的なフィルタリングロジックを実装
    //   return data.yourDynamicField.includes(filter);
    // };

  }

  ngAfterViewInit() {

  }


  ngOnInit(): void {

    this.metaDataService.getMetaDataProcessesLayout().subscribe(
      {
        next: (processRoot: Process) => {
          console.log(processRoot);
          for(let process of processRoot.value){
            let processInfo: ProcessInfo = {
              name: process.name,
              fields: []
            }
    
            // システムのフィールド
            for(let systemControl of process.layout.systemControls){
              let referenceId = systemControl.id;
              let label = systemControl.label;
              if(referenceId === undefined || label === undefined || referenceId.length === 0){
                continue;
              }
              processInfo.fields.push({
                ReferenceId: referenceId,
                LabelText: label
              })
            }
            // レイアウトのフィールド
            for(let page of process.layout.pages){
              for(let section of page.sections){
                for(let group of section.groups){
                  for(let control of group.controls){
                    let referenceId = control.id;
                    let label = control.label;
                    processInfo.fields.push({
                      ReferenceId: referenceId,
                      LabelText: label
                    })
                  }
                }
              }
            }
            this.processInfos.push(processInfo);
          }
        },
        error: (error) => {
          console.log(error);
        }
      }
    );


    this.metaDataService.getMetaDataFields().subscribe({ next: (field: Field) => {
      this.fields = field.value;
      for(let f of this.fields){
        this.selectedFields.push({
          isVisible: false,
          isSelected: false,
          name: f.name,
          referenceName: f.referenceName,
          description: f.description
        });
      }
    },
    error: (error) => {
      console.log(error);
      }
    })

    this.dataStoreService.getWorkItems().subscribe({next : (workItems: WorkItem[]) => {
      // workItemsをループで回して、フィールを動的に列挙してthis.valuesにフィールドを追加して、配列の追加する。
      for(let workItem of workItems){
        let dynamicObject: DynamicObject = {};
        dynamicObject["id"] = workItem.id;
        dynamicObject["rev"] = workItem.rev;
        for(let field in workItem.fields){
          dynamicObject[field] = workItem.fields[field].toString();
        };
        this.values.push(dynamicObject);
      }
      this.dataSource = new MatTableDataSource<DynamicObject>(this.values);
      this.dataSource.paginator = this.paginator;
      this.isLoading = false;
    },
    error: (error) => {
      console.log(error);
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }


  onSelectionChangeProcesses($event: MatOptionSelectionChange<string>) {

    let displayColumns: DisplayColumn[] = [];

    this.displayColumns = [];
    let displayedColumns = [
      "id",
      "rev",
    ];

    displayColumns.push({
      id: "id",
      label: "ID",
      isVisible: true,
      displayOrder: 0
    });
    displayColumns.push({
      id: "rev",
      label: "Rev",
      isVisible: true,
      displayOrder: 1
    });

    // 選択されたプロセスを保持
    for(let processInfo of this.processInfos){
      if (processInfo.name === $event.source.value){
        console.log(processInfo);
        if ($event.source.selected){
          this.selectedProcessInfos.set(processInfo.name, processInfo);
        }else{
          this.selectedProcessInfos.delete(processInfo.name);
        }
      }
    }

    let displayOrder = 0;
    // 選択されたチケットの種類のフィールドを保持する。
    for(let [key, value] of this.selectedProcessInfos){
      for(let processField of value.fields){
        // すでに表示カラムにあるフィールドは追加しない。
        let findFields = displayColumns.filter((x) => x.id === processField.ReferenceId);
        if(findFields.length > 0){
          continue;
        }
        // 参照IDがないフィールドは追加しない。
        if (processField.ReferenceId === undefined || processField.ReferenceId.length === 0){
          continue;
        }
        displayColumns.push({
          id: processField.ReferenceId,
          label: processField.LabelText,
          isVisible: false,
          displayOrder: displayOrder
        })
        displayOrder++;
      }
    }

    // 選択されていないフィールドを削除する
    this.displayColumns = this.displayColumns.filter((x) => {
      return displayColumns.filter((y) => y.id === x.id).length > 0;
    })

    // this.displayColumnsをdisplayOrderソートする。
    this.displayColumns = this.displayColumns.sort(((a, b) => {return a.displayOrder > b.displayOrder ? 0 :1}))

    console.log("this.displayColumns[displayColumns.length - 1]: {}", this.displayColumns[displayColumns.length - 1]);
    displayOrder = this.displayColumns.length > 0 ? this.displayColumns[displayColumns.length - 1].displayOrder + 1 : 0;

    // 選択されたチケットの種類のフィールド
    for(let displayColumn of displayColumns){
      // すでに表示カラムにあるフィールドは追加しない。
      let findFields = this.displayColumns.filter((x) => x.id === displayColumn.id);
      if(findFields.length > 0){
        continue;
      }
      this.displayColumns.push({
        id: displayColumn.id, 
        label: displayColumn.label,
        isVisible: false,
        displayOrder: displayOrder
      })
      displayOrder++;
      
    }

    for(let displayColumn of this.displayColumns){
      if(!displayColumn.isVisible) continue;
      displayedColumns.push(displayColumn.id)
    }
    this.displayedColumns = displayedColumns;
  }

  onClickSelectedField($event: boolean) {
    for(let displayColumn of this.displayColumns){
      // 表示するにチェックが入っているフィールドを追加する。
      if(displayColumn.isVisible){
        if(this.displayedColumns.filter((x) => x === displayColumn.id).length > 0){
          continue;
        }
        this.displayedColumns.push(displayColumn.id)
      }else{
        // 表示しないにチェックが入っているフィールドを削除する。
        this.displayedColumns = this.displayedColumns.filter((x) => x !== displayColumn.id);
      }
    }
  }


  onDropListDropped($event: CdkDragDrop<any,any,any>) {

    let currentIndex = $event.currentIndex;
    let previousIndex = $event.previousIndex;

    // Drag&Dropの順番を変更する。
    let displayColumns: DisplayColumn[] = [];
    for(let displayColumn of this.displayColumns){
      let displayOrderNumber = displayColumn.displayOrder;
      if (currentIndex > previousIndex){
        if (currentIndex >= displayOrderNumber && displayOrderNumber > previousIndex){
          displayOrderNumber--;
        }else if (displayOrderNumber === previousIndex){
          displayOrderNumber = currentIndex;
        }
      }else{
        if (currentIndex <= displayOrderNumber && displayOrderNumber < previousIndex){
          displayOrderNumber++;
        }else if (displayOrderNumber === previousIndex){
          displayOrderNumber = currentIndex;
        }
      }
      let displayColumnTemp: DisplayColumn =  {
        id: displayColumn.id, 
        label: displayColumn.label,
        isVisible: displayColumn.isVisible,
        displayOrder: displayOrderNumber
      }
      displayColumns.push(displayColumnTemp);
    }
    displayColumns = [...displayColumns.sort((a, b) => a.displayOrder - b.displayOrder)];
    this.displayColumns = displayColumns;
  }
    
}
