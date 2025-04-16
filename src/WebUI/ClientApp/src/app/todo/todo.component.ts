import { Component, TemplateRef, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { BsModalService, BsModalRef } from 'ngx-bootstrap/modal';
import {
    TodoListsClient,
    TodoItemsClient,
    TodoListDto,
    TodoItemDto,
    PriorityLevelDto,
    CreateTodoListCommand,
    UpdateTodoListCommand,
    CreateTodoItemCommand,
    UpdateTodoItemDetailCommand,
    TagDto,
    TagsClient,
    CreateTagCommand,
} from '../web-api-client';

@Component({
    selector: 'app-todo-component',
    templateUrl: './todo.component.html',
    styleUrls: ['./todo.component.scss'],
})
export class TodoComponent implements OnInit {
    debug = false;
    deleting = false;
    deleteCountDown = 0;
    deleteCountDownInterval: any;
    lists: TodoListDto[];
    priorityLevels: PriorityLevelDto[];
    selectedList: TodoListDto;
    selectedItem: TodoItemDto;
    newListEditor: any = {};
    listOptionsEditor: any = {};
    newListModalRef: BsModalRef;
    listOptionsModalRef: BsModalRef;
    deleteListModalRef: BsModalRef;
    itemDetailsModalRef: BsModalRef;
    editTagsModalRef: BsModalRef;

    itemDetailsFormGroup = this.fb.group({
        id: [null],
        listId: [null],
        priority: [''],
        note: [''],
        backgroundColour: [''],
    });

    // Background color
    backgroundColours = [
        { name: 'White', value: '#FFFFFF' },
        { name: 'Red', value: '#FF5733' },
        { name: 'Orange', value: '#FFC300' },
        { name: 'Yellow', value: '#FFFF66' },
        { name: 'Green', value: '#CCFF99' },
        { name: 'Blue', value: '#6666FF' },
        { name: 'Purple', value: '#9966CC' },
        { name: 'Grey', value: '#999999' },
    ];
    selectedColor: string | null = null;

    // Tags
    allTags: TagDto[] = [];
    newTagName: string = '';
    newTagColor: string = '#6666FF';
    supportedColors: string[] = [
        '#FFFFFF',
        '#FF5733',
        '#FFC300',
        '#FFFF66',
        '#CCFF99',
        '#6666FF',
        '#9966CC',
        '#999999',
    ];
    selectedFilterTags: TagDto[] = [];
    searchText: string = '';

    constructor(
        private listsClient: TodoListsClient,
        private itemsClient: TodoItemsClient,
        private tagsClient: TagsClient,
        private modalService: BsModalService,
        private fb: FormBuilder
    ) { }

    ngOnInit(): void {
        this.listsClient.get().subscribe(
            (result) => {
                this.lists = result.lists;
                this.priorityLevels = result.priorityLevels;
                if (this.lists.length) this.selectedList = this.lists[0];
            },
            (error) => console.error(error)
        );

        this.tagsClient.getAllTags().subscribe({
            next: (tags) => (this.allTags = tags),
            error: (error) => console.error(error),
        });
    }

    selectBackgroundColour(color: string): void {
        this.selectedColor = color;
        this.itemDetailsFormGroup.patchValue({ backgroundColour: color });
    }

    // Lists
    remainingItems(list: TodoListDto): number {
        return list.items.filter((t) => !t.done).length;
    }

    showNewListModal(template: TemplateRef<any>): void {
        this.newListModalRef = this.modalService.show(template);
        setTimeout(() => document.getElementById('title').focus(), 250);
    }

    newListCancelled(): void {
        this.newListModalRef.hide();
        this.newListEditor = {};
    }

    addList(): void {
        const list = {
            id: 0,
            title: this.newListEditor.title,
            items: [],
        } as TodoListDto;

        this.listsClient.create(list as CreateTodoListCommand).subscribe(
            (result) => {
                list.id = result;
                this.lists.push(list);
                this.selectedList = list;
                this.newListModalRef.hide();
                this.newListEditor = {};
            },
            (error) => {
                const errors = JSON.parse(error.response);
                if (errors?.Title) this.newListEditor.error = errors.Title[0];
                setTimeout(() => document.getElementById('title').focus(), 250);
            }
        );
    }

    showListOptionsModal(template: TemplateRef<any>) {
        this.listOptionsEditor = {
            id: this.selectedList.id,
            title: this.selectedList.title,
        };
        this.listOptionsModalRef = this.modalService.show(template);
    }

    updateListOptions() {
        const list = this.listOptionsEditor as UpdateTodoListCommand;
        this.listsClient.update(this.selectedList.id, list).subscribe(
            () => {
                this.selectedList.title = this.listOptionsEditor.title;
                this.listOptionsModalRef.hide();
                this.listOptionsEditor = {};
            },
            (error) => console.error(error)
        );
    }

    confirmDeleteList(template: TemplateRef<any>) {
        this.listOptionsModalRef.hide();
        this.deleteListModalRef = this.modalService.show(template);
    }

    deleteListConfirmed(): void {
        this.listsClient.delete(this.selectedList.id).subscribe(
            () => {
                this.deleteListModalRef.hide();
                this.lists = this.lists.filter((t) => t.id !== this.selectedList.id);
                this.selectedList = this.lists.length ? this.lists[0] : null;
            },
            (error) => console.error(error)
        );
    }

    // Items
    showItemDetailsModal(template: TemplateRef<any>, item: TodoItemDto): void {
        this.selectedItem = item;
        this.itemDetailsFormGroup.patchValue(this.selectedItem);
        this.selectedColor = this.selectedItem.backgroundColour;
        this.itemDetailsModalRef = this.modalService.show(template);
        this.itemDetailsModalRef.onHidden.subscribe(() => this.stopDeleteCountDown());
    }

    updateItemDetails(): void {
        const item = new UpdateTodoItemDetailCommand(
            this.itemDetailsFormGroup.value
        );
        this.itemsClient.updateItemDetails(this.selectedItem.id, item).subscribe(
            () => {
                if (this.selectedItem.listId !== item.listId) {
                    this.selectedList.items = this.selectedList.items.filter(
                        (i) => i.id !== this.selectedItem.id
                    );
                    const listIndex = this.lists.findIndex((l) => l.id === item.listId);
                    this.selectedItem.listId = item.listId;
                    this.lists[listIndex].items.push(this.selectedItem);
                }

                this.selectedItem.priority = item.priority;
                this.selectedItem.note = item.note;
                this.selectedItem.backgroundColour = item.backgroundColour;
                this.itemDetailsModalRef.hide();
                this.itemDetailsFormGroup.reset();
            },
            (error) => console.error(error)
        );
    }

    addItem() {
        const item = {
            id: 0,
            listId: this.selectedList.id,
            priority: this.priorityLevels[0].value,
            title: '',
            done: false,
        } as TodoItemDto;

        this.selectedList.items.push(item);
        const index = this.selectedList.items.length - 1;
        this.editItem(item, 'itemTitle' + index);
    }

    editItem(item: TodoItemDto, inputId: string): void {
        this.selectedItem = item;
        setTimeout(() => document.getElementById(inputId).focus(), 100);
    }

    updateItem(item: TodoItemDto, pressedEnter: boolean = false): void {
        const isNewItem = item.id === 0;

        if (!item.title.trim()) {
            this.deleteItem(item);
            return;
        }

        if (item.id === 0) {
            this.itemsClient
                .create({ ...item, listId: this.selectedList.id } as CreateTodoItemCommand)
                .subscribe((result) => (item.id = result), (error) => console.error(error));
        } else {
            this.itemsClient.update(item.id, item).subscribe(
                () => console.log('Update succeeded.'),
                (error) => console.error(error)
            );
        }

        this.selectedItem = null;
        if (isNewItem && pressedEnter) setTimeout(() => this.addItem(), 250);
    }

    deleteItem(item: TodoItemDto, countDown?: boolean) {
        if (countDown) {
            if (this.deleting) {
                this.stopDeleteCountDown();
                return;
            }
            this.deleteCountDown = 3;
            this.deleting = true;
            this.deleteCountDownInterval = setInterval(() => {
                if (this.deleting && --this.deleteCountDown <= 0) {
                    this.deleteItem(item, false);
                }
            }, 1000);
            return;
        }

        this.deleting = false;
        if (this.itemDetailsModalRef) this.itemDetailsModalRef.hide();

        if (item.id === 0) {
            const itemIndex = this.selectedList.items.indexOf(this.selectedItem);
            this.selectedList.items.splice(itemIndex, 1);
        } else {
            this.itemsClient.delete(item.id).subscribe(
                () =>
                (this.selectedList.items = this.selectedList.items.filter(
                    (t) => t.id !== item.id
                )),
                (error) => console.error(error)
            );
        }
    }

    stopDeleteCountDown() {
        clearInterval(this.deleteCountDownInterval);
        this.deleteCountDown = 0;
        this.deleting = false;
    }

    // Tags
    isTagSelected(tag: TagDto): boolean {
        return this.selectedItem?.tags?.some((t) => t.id === tag.id) ?? false;
    }

    toggleTag(tag: TagDto): void {
        if (!this.selectedItem?.tags) return;

        const index = this.selectedItem.tags.findIndex((t) => t.id === tag.id);
        if (index > -1) {
            this.selectedItem.tags.splice(index, 1);
            this.itemsClient.removeTag(this.selectedItem.id, tag.id).subscribe();
        } else {
            this.selectedItem.tags.push(tag);
            this.itemsClient.addTag(this.selectedItem.id, tag.id).subscribe();
        }
    }

    addNewTag(): void {
        const trimmed = this.newTagName.trim();
        if (!trimmed) return;

        const existing = this.allTags.find(
            (t) => t.name.toLowerCase() === trimmed.toLowerCase()
        );
        if (existing) {
            this.toggleTag(existing);
        } else {
            const newTag = CreateTagCommand.fromJS({
                name: trimmed,
                color: this.newTagColor,
            });

            this.tagsClient.create(newTag).subscribe({
                next: (id) => {
                    const created = TagDto.fromJS({
                        id,
                        name: trimmed,
                        color: this.newTagColor,
                    });
                    this.allTags.push(created);
                    this.selectedItem?.tags?.push(created);
                    this.newTagName = '';
                    this.newTagColor = this.supportedColors.slice(-1)[0] ?? '#6666FF';
                },
                error: (err) => console.error(err),
            });
        }
    }

    toggleFilterTag(tag: TagDto): void {
        const index = this.selectedFilterTags.findIndex((t) => t.id === tag.id);
        if (index > -1) {
            this.selectedFilterTags.splice(index, 1);
        } else {
            this.selectedFilterTags.push(tag);
        }
    }

    isFilterTagSelected(tag: TagDto): boolean {
        return this.selectedFilterTags.some((t) => t.id === tag.id);
    }

    get filteredItems(): TodoItemDto[] {
        if (!this.selectedList?.items) return [];

        let result = this.selectedList.items;

        if (this.selectedFilterTags.length > 0) {
            result = result.filter((item) =>
                this.selectedFilterTags.every((tag) =>
                    item.tags?.some((t) => t.id === tag.id)
                )
            );
        }

        if (this.searchText.trim()) {
            const search = this.searchText.toLowerCase();
            result = result.filter((item) =>
                item.title?.toLowerCase().includes(search)
            );
        }

        return result;
    }

    setTagColor(color: string) {
        this.newTagColor = color;
    }

    openEditTagsModal(template: TemplateRef<any>) {
        this.editTagsModalRef = this.modalService.show(template);
    }

    deleteTag(tag: TagDto): void {
        this.tagsClient.delete(tag.id!).subscribe({
            next: () => {
                this.allTags = this.allTags.filter((t) => t.id !== tag.id);
                this.selectedList.items.forEach((item) => {
                    item.tags = item.tags?.filter((t) => t.id !== tag.id);
                });
            },
            error: (err) => console.error('Delete error:', err),
        });
    }

    getContrastingTextColor(bgColor: string): string {
        const hex = bgColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;
        return luma > 150 ? '#000' : '#fff';
    }
}
