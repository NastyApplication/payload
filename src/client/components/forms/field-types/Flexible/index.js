import React, {
  useContext, useEffect, useReducer, useState, Fragment,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useModal } from '@trbl/react-modal';

import withCondition from '../../withCondition';
import Button from '../../../controls/Button';
import FormContext from '../../Form/Context';
import Section from '../../../layout/Section';
import AddRowModal from './AddRowModal';
import collapsibleReducer from './reducer';
import DraggableSection from '../../DraggableSection'; // eslint-disable-line import/no-cycle

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    blocks,
    defaultValue,
    singularLabel,
    fieldTypes,
  } = props;

  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();
  const [rowIndexBeingAdded, setRowIndexBeingAdded] = useState(null);
  const [hasModifiedRows, setHasModifiedRows] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [collapsibleStates, dispatchCollapsibleStates] = useReducer(collapsibleReducer, []);
  const formContext = useContext(FormContext);
  const modalSlug = `flexible-${name}`;

  const { fields: fieldState, dispatchFields } = formContext;

  const addRow = (rowIndex, blockType) => {
    const blockToAdd = blocks.find(block => block.slug === blockType);

    dispatchFields({
      type: 'ADD_ROW', rowIndex, name, fieldSchema: blockToAdd.fields, blockType,
    });

    dispatchCollapsibleStates({
      type: 'ADD_COLLAPSIBLE', collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount + 1);
    setHasModifiedRows(true);
  };

  const removeRow = (rowIndex) => {
    dispatchFields({
      type: 'REMOVE_ROW', rowIndex, name,
    });

    dispatchCollapsibleStates({
      type: 'REMOVE_COLLAPSIBLE',
      collapsibleIndex: rowIndex,
    });

    setRowCount(rowCount - 1);
    setHasModifiedRows(true);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchFields({
      type: 'MOVE_ROW', moveFromIndex, moveToIndex, name,
    });

    dispatchCollapsibleStates({
      type: 'MOVE_COLLAPSIBLE', collapsibleIndex: moveFromIndex, moveToIndex,
    });

    setHasModifiedRows(true);
  };

  const openAddRowModal = (rowIndex) => {
    setRowIndexBeingAdded(rowIndex);
    toggleModal(modalSlug);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  useEffect(() => {
    setRowCount(defaultValue.length);
    setHasModifiedRows(false);

    dispatchCollapsibleStates({
      type: 'SET_ALL_COLLAPSIBLES',
      payload: Array.from(Array(defaultValue.length).keys()).reduce(acc => ([...acc, true]), []), // sets all collapsibles to open on first load
    });
  }, [defaultValue]);

  return (
    <Fragment>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
          <Section
            heading={label}
            className="flexible"
          >
            <Droppable droppableId="flexible-drop">
              {provided => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                >
                  {rowCount !== 0 && Array.from(Array(rowCount).keys()).map((_, rowIndex) => {
                    let blockType = fieldState[`${name}.${rowIndex}.blockType`]?.value;

                    if (!hasModifiedRows && !blockType) {
                      blockType = defaultValue?.[rowIndex]?.blockType;
                    }

                    const blockToRender = blocks.find(block => block.slug === blockType);

                    if (blockToRender) {
                      return (
                        <DraggableSection
                          fieldTypes={fieldTypes}
                          key={rowIndex}
                          parentName={name}
                          addRow={() => openAddRowModal(rowIndex)}
                          removeRow={() => removeRow(rowIndex)}
                          rowIndex={rowIndex}
                          fieldState={fieldState}
                          fieldSchema={[
                            ...blockToRender.fields,
                            {
                              name: 'blockType',
                              type: 'hidden',
                            }, {
                              name: 'blockName',
                              type: 'hidden',
                            },
                          ]}
                          singularLabel={blockType}
                          defaultValue={hasModifiedRows ? undefined : defaultValue[rowIndex]}
                          dispatchCollapsibleStates={dispatchCollapsibleStates}
                          collapsibleStates={collapsibleStates}
                          blockType="flexible"
                        />
                      );
                    }

                    return null;
                  })
                  }
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            <div className={`${baseClass}__add-button-wrap`}>
              <Button
                onClick={() => openAddRowModal(rowCount)}
                type="secondary"
              >
                {`Add ${singularLabel}`}
              </Button>
            </div>
          </Section>
        </div>
      </DragDropContext>
      <AddRowModal
        closeAllModals={closeAllModals}
        addRow={addRow}
        rowIndexBeingAdded={rowIndexBeingAdded}
        slug={modalSlug}
        blocks={blocks}
      />
    </Fragment>
  );
};

Flexible.defaultProps = {
  label: '',
  defaultValue: [],
  singularLabel: 'Block',
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  singularLabel: PropTypes.string,
  name: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
};

export default withCondition(Flexible);
