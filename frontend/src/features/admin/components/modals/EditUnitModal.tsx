/**
 * EditUnitModal Component
 * Modal for creating/editing units (departments) with a clean, professional design
 */

import React, { useState } from 'react';
import { Building2, Save, Plus } from 'lucide-react';

import { Modal, Button, Input, TextArea } from '../../../../design-system';
import type { EditUnitModalProps } from '../../types';

export const EditUnitModal: React.FC<EditUnitModalProps> = ({
    unit,
    onClose,
    onSave,
    t
}) => {
    const [formData, setFormData] = useState({
        name: unit.name || '',
        description: unit.description || ''
    });
    const isEdit = !!unit.id;

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            size="md"
            title={isEdit ? t('admin.editUnit') : t('admin.addUnit')}
            footer={
                <>
                    <Button variant="ghost" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button
                        variant="primary"
                        icon={isEdit ? <Save size={16} /> : <Plus size={16} />}
                        onClick={() => onSave(formData)}
                        disabled={!formData.name}
                    >
                        {isEdit ? t('common.save') : t('common.create')}
                    </Button>
                </>
            }
        >
            <div className="space-y-6">
                <Input
                    label={t('common.name')}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder={t('common.name')}
                    leftIcon={<Building2 size={16} />}
                    fullWidth
                />

                <TextArea
                    label={t('common.description')}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={t('common.description')}
                    rows={5}
                    fullWidth
                />
            </div>
        </Modal>
    );
};

export default EditUnitModal;
