import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TableType, insertTableTypeSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, PlusCircle, Edit, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Form schema for creating/editing table types
const tableTypeFormSchema = insertTableTypeSchema.extend({
  restaurantId: z.number(),
});

type TableTypeFormValues = z.infer<typeof tableTypeFormSchema>;

interface TableTypeManagerProps {
  restaurantId: number;
}

export default function TableTypeManager({ restaurantId }: TableTypeManagerProps) {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingTableType, setEditingTableType] = useState<TableType | null>(null);

  // Fetch table types
  const { data: tableTypes, isLoading: isLoadingTableTypes } = useQuery<TableType[]>({
    queryKey: [`/api/restaurants/${restaurantId}/table-types`],
  });

  // Create table type mutation
  const createTableType = useMutation({
    mutationFn: async (data: TableTypeFormValues) => {
      return await apiRequest({
        url: `/api/restaurants/${restaurantId}/table-types`,
        method: "POST",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/table-types`] });
      toast({
        title: "Table type created",
        description: "The table type has been created successfully.",
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create table type: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Update table type mutation
  const updateTableType = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<TableType> }) => {
      return await apiRequest({
        url: `/api/table-types/${id}`,
        method: "PATCH",
        body: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/table-types`] });
      toast({
        title: "Table type updated",
        description: "The table type has been updated successfully.",
      });
      setEditingTableType(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update table type: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Delete table type mutation
  const deleteTableType = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest({
        url: `/api/table-types/${id}`,
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/restaurants/${restaurantId}/table-types`] });
      toast({
        title: "Table type deleted",
        description: "The table type has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete table type: ${(error as Error).message}`,
        variant: "destructive",
      });
    },
  });

  // Form for creating/editing table types
  const form = useForm<TableTypeFormValues>({
    resolver: zodResolver(tableTypeFormSchema),
    defaultValues: {
      restaurantId,
      name: "",
      capacity: 2,
      count: 1,
      estimatedTurnoverTime: 45,
      isActive: true,
    },
  });

  // Handle form submission
  const onSubmit = (values: TableTypeFormValues) => {
    if (editingTableType) {
      updateTableType.mutate({
        id: editingTableType.id,
        data: values,
      });
    } else {
      createTableType.mutate(values);
    }
  };

  // Open edit dialog with existing table type data
  const handleEdit = (tableType: TableType) => {
    setEditingTableType(tableType);
    form.reset({
      restaurantId: tableType.restaurantId,
      name: tableType.name,
      capacity: tableType.capacity,
      count: tableType.count,
      estimatedTurnoverTime: tableType.estimatedTurnoverTime,
      isActive: tableType.isActive,
    });
  };

  // Handle delete confirmation
  const handleDelete = (id: number) => {
    // Use a custom confirmation dialog
    const confirmed = confirm("Are you sure you want to delete this table type?");
    if (confirmed) {
      deleteTableType.mutate(id);
    }
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-md font-semibold">Table Types</h4>
        <Button
          size="sm"
          onClick={() => {
            form.reset({
              restaurantId,
              name: "",
              capacity: 2,
              count: 1,
              estimatedTurnoverTime: 45,
              isActive: true,
            });
            setIsAddDialogOpen(true);
          }}
        >
          <PlusCircle className="h-4 w-4 mr-1" /> Add Table Type
        </Button>
      </div>

      {isLoadingTableTypes ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : !tableTypes || tableTypes.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No table types defined yet.</p>
          <Button
            variant="outline"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <PlusCircle className="h-4 w-4 mr-1" /> Add Your First Table Type
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {tableTypes.map((tableType) => (
            <div key={tableType.id} className="bg-white rounded-lg border p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{tableType.name}</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEdit(tableType)} 
                  className="text-red-600 hover:text-red-900"
                >
                  Edit
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Capacity:</span>
                  <span className="font-medium">{tableType.capacity} people</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Count:</span>
                  <span className="font-medium">{tableType.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Avg. Turnover:</span>
                  <span className="font-medium">{tableType.estimatedTurnoverTime} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${tableType.isActive ? 'text-green-600' : 'text-gray-600'}`}>
                    {tableType.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Table Type Dialog */}
      <Dialog open={isAddDialogOpen || !!editingTableType} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setEditingTableType(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTableType ? 'Edit Table Type' : 'Add New Table Type'}</DialogTitle>
            <DialogDescription>
              Define your restaurant's table types to optimize queue management and wait time predictions.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Table Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Two-seater, Booth, Outdoor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seating Capacity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove leading zeros and convert to number
                          const numValue = value === '' ? 0 : parseInt(value, 10);
                          field.onChange(numValue);
                        }}
                        onBlur={(e) => {
                          // Ensure no leading zeros on blur
                          const value = e.target.value;
                          if (value && value !== '0') {
                            e.target.value = parseInt(value, 10).toString();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Tables</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove leading zeros and convert to number
                          const numValue = value === '' ? 0 : parseInt(value, 10);
                          field.onChange(numValue);
                        }}
                        onBlur={(e) => {
                          // Ensure no leading zeros on blur
                          const value = e.target.value;
                          if (value && value !== '0') {
                            e.target.value = parseInt(value, 10).toString();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedTurnoverTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Turnover Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={15}
                        max={240}
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value;
                          // Remove leading zeros and convert to number
                          const numValue = value === '' ? 0 : parseInt(value, 10);
                          field.onChange(numValue);
                        }}
                        onBlur={(e) => {
                          // Ensure no leading zeros on blur
                          const value = e.target.value;
                          if (value && value !== '0') {
                            e.target.value = parseInt(value, 10).toString();
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value ? "active" : "inactive"}
                        onValueChange={(value) => field.onChange(value === "active")}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setEditingTableType(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTableType.isPending || updateTableType.isPending}
                >
                  {(createTableType.isPending || updateTableType.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingTableType ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingTableType ? 'Update Table Type' : 'Create Table Type'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}