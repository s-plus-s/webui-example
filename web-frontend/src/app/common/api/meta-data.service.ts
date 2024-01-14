import {Injectable} from '@angular/core';
import {catchError, map, Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {baseUrl} from '../const/path';
import {Category} from "../model/category";
import {Field} from "../model/field";
import {Classification} from "../model/classification";
import {State} from "../model/state";
import {WorkItemTypes} from "../model/workitemtypes";
import {Process} from "../model/process";
import { of } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class MetaDataService {

  // コンストラクタ(HttpClientModuleをDI)
  constructor(private httpClient: HttpClient) { }


  // WebAPIの呼び出し
  getMetaDataCategories(): Observable<Category> {
    console.log('getMetaDataCategories');
    // WebAPIの呼び出しとエラー処理
    return this.httpClient.get<Category>(baseUrl + 'api/categories').pipe(
      map((category) => {
        return category;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })
    ));
  }

  getMetaDataFields(): Observable<Field> {
    console.log('getMetaDataFields');
    // WebAPIの呼び出し
    return this.httpClient.get<Field>(baseUrl + 'api/fields').pipe(
      map((field) => {
        return field;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })));
  }

  getMetaDataWorkItemTypes(): Observable<WorkItemTypes> {
    console.log('getMetaDataWorkItemTypes');

    // WebAPIの呼び出し
    return this.httpClient.get<WorkItemTypes>(baseUrl + 'api/workitemtypes').pipe(
      map((value) => {
        return value;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })));
  }

  getMetaDataClassification(): Observable<Classification> {
    console.log('getMetaDataClassification');

    // WebAPIの呼び出し
    return this.httpClient.get<Classification>(baseUrl + 'api/classification').pipe(
      map((field) => {
        return field;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })));
  }

  getMetaDataStates(): Observable<State> {
    console.log('getMetaDataStates');

    // WebAPIの呼び出し
    return this.httpClient.get<State>(baseUrl + 'api/states').pipe(
      map((state) => {
        return state;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })));
  }

  getMetaDataProcessesLayout(): Observable<Process> {
    console.log('getMetaDataProcessesLayout');
    
    // WebAPIの呼び出し
    return this.httpClient.get<Process>(baseUrl + 'api/processes/layout').pipe(
      map((process) => {
        return process;
      },
      catchError((error) => {
        console.log(error);
        return of(null);
      })));
  }





}
