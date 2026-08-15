import { Injectable } from '@nestjs/common';
import {
  ALL_PERMISSIONS,
  PERMISSION_CATALOG,
} from '../../../common/constants/permissions';

@Injectable()
export class PermissionsService {
  getCatalog() {
    return {
      modules: PERMISSION_CATALOG,
      all: ALL_PERMISSIONS,
    };
  }
}
